import Meta from "gi://Meta?version=13";
import Mtk from "gi://Mtk?version=13";
import Shell from "gi://Shell?version=13";

import type { LayoutManager, Monitor } from "resource:///org/gnome/shell/ui/layout.js";

import { DesktopEvent, Event } from "../types/desktop.js";
import {
  GridOffset,
  GridSelection,
  GridSize,
  Rectangle
} from "../types/grid.js";
import { CardinalDirection } from "../types/hotkeys.js";
import { DispatchFn, Publisher } from "../types/observable.js";
import { Node } from "../types/tree.js";
import { GarbageCollection, GarbageCollector } from "../util/gc.js";
import { adjust, pan } from "../util/grid.js";
import { GridSpec } from "../util/parser.js";
import { UserPreferencesProvider } from "./UserPreferences.js";

// splits computed gridspec cell areas in non-dynamic and dynamic cells
type GridSpecAreas = [dedicated: Rectangle[], dynamic: Rectangle[]];

type FrameSize = { width: number; height: number };

type MRect = Mtk.Rectangle;

const TitleBlacklist: RegExp[] = [
  // Desktop Icons NG (see https://github.com/gTile/gTile/issues/336#issuecomment-1804267328)
  // https://gitlab.com/rastersoft/desktop-icons-ng/-/blob/cfe944e2ce7a1d27e47b08c002cd100a1e2cb878/app/desktopManager.js#L396
  // https://gitlab.com/rastersoft/desktop-icons-ng/-/blob/cfe944e2ce7a1d27e47b08c002cd100a1e2cb878/app/desktopGrid.js#L160
  /;BDHF$/,
];

export interface DesktopManagerParams {
  shell: Shell.Global;
  display: Meta.Display;
  layoutManager: LayoutManager;
  monitorManager: Meta.MonitorManager;
  workspaceManager: Meta.WorkspaceManager;
  userPreferences: UserPreferencesProvider;
}

/**
 * Abstracts over a multitude of Gnome APIs to provide a unified interface for
 * desktop-related actions and window manipulation.
 */
export default class implements Publisher<DesktopEvent>, GarbageCollector {
  #gc: GarbageCollection;
  #shell: Shell.Global;
  #display: Meta.Display;
  #layoutManager: LayoutManager;
  #workspaceManager: Meta.WorkspaceManager;
  #userPreferences: UserPreferencesProvider;
  #dispatchCallbacks: DispatchFn<DesktopEvent>[];

  constructor({
    shell,
    display,
    layoutManager,
    monitorManager,
    workspaceManager,
    userPreferences,
  }: DesktopManagerParams) {
    this.#gc = new GarbageCollection();
    this.#shell = shell;
    this.#display = display;
    this.#layoutManager = layoutManager;
    this.#workspaceManager = workspaceManager;
    this.#userPreferences = userPreferences;
    this.#dispatchCallbacks = [];

    {
      const chid = monitorManager.connect("monitors-changed", () => {
        this.#dispatch({ type: Event.MONITORS_CHANGED });
      });
      this.#gc.defer(() => layoutManager.disconnect(chid));
    }
    {
      const chid = display.connect("notify::focus-window", () => {
        this.#dispatch({ type: Event.FOCUS, target: display.focus_window });
      });
      this.#gc.defer(() => display.disconnect(chid));
    }
  }

  /**
   * Must be called prior to disposing the class instance. Cancels subscriptions
   * on the global Gnome singletons. The instance must not be used thereafter.
   */
  release() {
    this.#dispatchCallbacks = [];
    this.#gc.release();
  }

  subscribe(fn: DispatchFn<DesktopEvent>) {
    this.#dispatchCallbacks.push(fn);
  }

  /**
   * The window that is currently in focus.
   */
  get focusedWindow(): Meta.Window | null {
    // current implementation already returns null but since this is not
    // documented, use nullish coalescing for safety.
    return this.#display.focus_window ?? null;
  }

  /**
   * The list of monitors that comprise the desktop.
   */
  get monitors(): Monitor[] {
    return this.#layoutManager.monitors;
  }

  /**
   * The current pointer location as X/Y coordinates.
   */
  get pointer(): [x: number, y: number] {
    const [x, y] = this.#shell.get_pointer();

    return [x, y];
  }

  /**
   * The monitor index that the pointer resides on.
   */
  get pointerMonitorIdx(): number {
    const [mouseX, mouseY] = this.#shell.get_pointer();

    for (const monitor of this.#layoutManager.monitors) {
      if (
        monitor.x <= mouseX && mouseX <= (monitor.x + monitor.width) &&
        monitor.y <= mouseY && mouseY <= (monitor.y + monitor.height)
      ) {
        return monitor.index;
      }
    }

    return 0;
  }

  /**
   * Moves a window to another monitor, keeping the relative position of the
   * window's top left corner.
   *
   * @param target The window to be moved.
   * @param monitorIdx Optional. When not given, rotate amongst monitors.
   */
  moveToMonitor(target: Meta.Window, monitorIdx?: number) {
    monitorIdx = monitorIdx ?? (target.get_monitor() + 1) % this.monitors.length;
    target.unmaximize(Meta.MaximizeFlags.BOTH);
    target.move_to_monitor(monitorIdx);
  }

  /**
   * Adjusts the window size and position to match the {@link selection}.
   *
   * @param target The window which is going to be adjusted.
   * @param monitorIdx The {@link Monitor.index} to perform the operation on.
   * @param gridSize The size of the grid that the selection belongs to.
   * @param selection The selection to be applied.
   */
  applySelection(
    target: Meta.Window,
    monitorIdx: number,
    gridSize: GridSize,
    selection: GridSelection,
  ) {
    const projectedArea = this.selectionToArea(selection, gridSize, monitorIdx);

    this.#fit(target, projectedArea);
  }

  /**
   * Projects a {@link selection} to an area on the {@link monitorIdx|monitor}.
   *
   * @param selection The selection to be mapped/projected.
   * @param gridSize The reference grid used to divide the monitor’s work area.
   * @param monitorIdx The monitor for which the selection is being mapped.
   * @param preview Optional. Deducts the user-configured spacing ahead of time.
   *   The spacing is usually deducted during the window resize operation.
   * @returns The mapped selection.
   */
  selectionToArea(
    selection: GridSelection,
    gridSize: GridSize,
    monitorIdx: number,
    preview = false,
  ): Rectangle {
    const
      { cols, rows } = gridSize,
      relX = Math.min(selection.anchor.col, selection.target.col) / cols,
      relY = Math.min(selection.anchor.row, selection.target.row) / rows,
      relW = (Math.abs(selection.anchor.col - selection.target.col) + 1) / cols,
      relH = (Math.abs(selection.anchor.row - selection.target.row) + 1) / rows,
      workArea = this.#workArea(monitorIdx),
      spacing = preview ? this.#userPreferences.getSpacing() : 0;

    return {
      x: workArea.x + workArea.width * relX + spacing,
      y: workArea.y + workArea.height * relY + spacing,
      width: workArea.width * relW - spacing * 2,
      height: workArea.height * relH - spacing * 2,
    }
  }

  /**
   * Maps the size and position of a window to the most fitting selection that
   * aligns with the provided {@link gridSize}. In case the window edges do not
   * perfectly align with the grid, the selection is always expanded to the most
   * nearby tile.
   *
   * @param window The window whose position & size should be mapped.
   * @param gridSize Reference grid size for which the selection is calculated.
   * @param snap Optional. The strategy to be used when the window edges do not
   *   perfectly align with the grid.
   * @returns The mapped selection.
   */
  windowToSelection(
    window: Meta.Window,
    gridSize: GridSize,
    snap: "closest" | "shrink" | "grow" = "closest",
  ): GridSelection {
    const frame = this.#frameRect(window);
    const workArea = this.#workArea(window.get_monitor());
    const relativeRect: Rectangle = {
      x: (frame.x - workArea.x) / workArea.width,
      y: (frame.y - workArea.y) / workArea.height,
      width: frame.width / workArea.width,
      height: frame.height / workArea.height,
    };

    return this.#rectToSelection(relativeRect, gridSize, snap);
  }

  /**
   * Expands the target window to maximize its area without overlapping any new
   * windows, ignoring those that were already overlapped in the first place.
   *
   * In general, this is an NP-hard problem and this implementation uses an
   * algorithm that has a runtime of O(2^n) where n is the number of windows
   * that needs to be avoided while auto expanding. Only those windows which are
   * not directly adjacent to either of the four cardinal directions must be
   * avoided, i.e., windows to the NE, NW, SE or SW. Windows which are located
   * directly to the N, E, S or W can be avoided trivially as they essentially
   * make up a boundary that cannot be exceeded (similar to the screen edge).
   *
   * Using this algorithm with O(2^n) is justifiable due to these reasons:
   *   1. In practice, n remains small, usually about 2 or 3. But even in
   *      artifical scenarios with n=8, its duration is still unnoticable.
   *   2. for a larger n, e.g. n = 8, the binary tree that is being constructed
   *      (and determines the 2^n runtime behavior) becomes either unbalanced
   *      quickly or has many of its childs at a depth above n. For instance, a
   *      practical test showed that the tree had only 23 childs for n=8 whereas
   *      the theoretical maximum would have been 2⁸ = 256.
   *
   * The algorithm uses an exhaustive search (aka brute-force) to find the
   * optimal expansion strategy for the window.
   */
  autogrow(target: Meta.Window) {
    const monitorIdx = target.get_monitor();
    const workArea = this.#workArea(monitorIdx);
    const [_, frame] = workArea.intersect(this.#frameRect(target));
    const workspace = target.get_workspace();
    const collisionWindows = workspace.list_windows().filter(win => !(
      win === target ||
      win.minimized ||
      win.get_frame_type() !== Meta.FrameType.NORMAL ||
      TitleBlacklist.some(p => p.test(win.title ?? "")) ||
      win.get_monitor() !== monitorIdx ||
      frame.contains_rect(this.#frameRect(win)) ||
      frame.intersect(this.#frameRect(win))[0]
    )).map(win => this.#frameRect(win));

    // Step 1: Calculate maximum possible boundary by finding windows directly
    // adjacent to the north, east, south or west. The work area of the monitor
    // is the ultimate boundary.
    const
      doShareXAxis = (r: Rectangle, o: Rectangle) =>
        r.x < (o.x + o.width) && o.x < (r.x + r.width),
      doShareYAxis = (r: Rectangle, o: Rectangle) =>
        r.y < (o.y + o.height) && o.y < (r.y + r.height),
      maxWestBound = Math.max(...collisionWindows
        .filter(win => this.#isWestOf(win, frame) && doShareYAxis(win, frame))
        .map(win => win.x + win.width)),
      maxNorthBound = Math.max(...collisionWindows
        .filter(win => this.#isNorthOf(win, frame) && doShareXAxis(win, frame))
        .map(win => win.y + win.height)),
      maxEastBound = Math.min(...collisionWindows
        .filter(win => this.#isEastOf(win, frame) && doShareYAxis(win, frame))
        .map(win => win.x)),
      maxSouthBound = Math.min(...collisionWindows
        .filter(win => this.#isSouthOf(win, frame) && doShareXAxis(win, frame))
        .map(win => win.y));

    // Math.max/Math.min handle -Infinity/Infinity cases
    const x = Math.max(maxWestBound, workArea.x);
    const y = Math.max(maxNorthBound, workArea.y);
    // @ts-ignore - Mtk.Rectangle has an incorrect constructor signature
    const optimalFrame = new Mtk.Rectangle({
      x, y,
      width: Math.min(maxEastBound, workArea.x + workArea.width) - x,
      height: Math.min(maxSouthBound, workArea.y + workArea.height) - y,
    });

    // Step 2: Further reduce the set of windows which could possible collide
    // with the target window. Keep only those windows which are located either
    // partly or entirely within the calculated boundary. Note that at this
    // point, this can only affect windows that are located to the NE, NW, SE or
    // SW of the target window. Then start building the tree and search for the
    // optimal solution.
    const remainingColliders = collisionWindows.filter(win =>
      optimalFrame.intersect(win)[0] || optimalFrame.contains_rect(win));
    const root = this.#tree(frame, optimalFrame, remainingColliders);

    this.#fit(target, this.#findBest(root));
  }

  /**
   * Applies a {@link GridSpec} to the targeted {@link Monitor.index}.
   *
   * The relative-sized cells of the GridSpec are mapped to the work area of the
   * monitor and are then populated with the windows that are located on that
   * monitor. The currently focused window gets placed into the cell with the
   * largest area. Afterwards, the remaining non-dynamic cells are populated
   * (randomly) with the remaining windows until either (1) no windows are left
   * to be placed or (2) no more cells are available to place them in. In the
   * latter case, the remaining windows are then placed in the dynamic cells of
   * the grid, if any. Dynamic cells share their space between the windows that
   * occupy them.
   *
   * @param spec The {@link GridSpec} to be applied.
   * @param monitorIdx The {@link Monitor.index} to apply the grid spec to.
   */
  autotile(spec: GridSpec, monitorIdx: number) {
    const [dedicated, dynamic] = this.#gridSpecToAreas(spec);
    const workArea = this.#workArea(monitorIdx);
    const windows = this.#workspaceManager.get_active_workspace().list_windows()
      .filter(window => window.get_monitor() === monitorIdx)
      .filter(window => TitleBlacklist.every(p => !p.test(window.title ?? "")));

    const project = (rect: Rectangle, canvas: Rectangle): Rectangle => ({
      x: canvas.x + canvas.width * rect.x,
      y: canvas.y + canvas.height * rect.y,
      width: canvas.width * rect.width,
      height: canvas.height * rect.height,
    });

    // Place focused window (if any) in the largest dedicated area
    const focusedIdx = windows.findIndex(w => w.has_focus());
    if (focusedIdx && dedicated.length > 0) {
      const [largestIdx] = dedicated.reduce(([accuIdx, accuArea], rect, idx) =>
        rect.width * rect.height > accuArea
          ? [idx, rect.width * rect.height]
          : [accuIdx, accuArea],
        [-1, 0]);

      const projectedArea = project(dedicated[largestIdx], workArea);
      this.#fit(windows[focusedIdx], projectedArea);

      windows.splice(focusedIdx, 1);
      dedicated.splice(largestIdx, 1);
    }

    // Place windows in regular cells
    for (let i = 0; i < dedicated.length && i < windows.length; ++i) {
      this.#fit(windows[i], project(dedicated[i], workArea));
    }

    // Fit remaining windows in dynamic cells
    windows.splice(0, dedicated.length);
    for (let i = 0; i < dynamic.length; i++) {
      const mustFitAtLeastN = Math.floor(windows.length / dynamic.length);
      const mustTakeOverflowWindow = i < (windows.length % dynamic.length);
      const n = mustFitAtLeastN + (mustTakeOverflowWindow ? 1 : 0);

      let j = i;
      for (const area of this.#splitN(dynamic[i], n)) {
        this.#fit(windows[j], project(area, workArea));
        j += dynamic.length;
      }
    }
  }

  /**
   * Moves a window such that its NW edge aligns with the next grid line in the
   * specified direction.
   *
   * @param target The window to be moved.
   * @param gridSize The grid with which to align the window.
   * @param dir The direction in which to move the window.
   */
  moveWindow(target: Meta.Window, gridSize: GridSize, dir: CardinalDirection) {
    const
      strategy = dir === "west" || dir === "north" ? "shrink" : "grow",
      frameFit = this.windowToSelection(target, gridSize, strategy),
      targetSelection = pan(frameFit, gridSize, dir),
      nwTile: GridOffset = {
        col: Math.min(targetSelection.anchor.col, targetSelection.target.col),
        row: Math.min(targetSelection.anchor.row, targetSelection.target.row),
      },
      asSelection: GridSelection = { anchor: nwTile, target: nwTile },
      monitorIdx = target.get_monitor(),
      targetArea = this.selectionToArea(asSelection, gridSize, monitorIdx),
      frame = this.#frameRect(target),
      newX = (dir === "north" || dir === "south") ? frame.x : targetArea.x,
      newY = (dir === "east"  || dir === "west")  ? frame.y : targetArea.y;

    this.#moveResize(target, newX, newY);
  }

  /**
   * Resizes a window by shrinking or extending an edge towards a specified
   * direction such that the edge aligns with the specified grid.
   *
   * @param target The window to be resized.
   * @param gridSize The grid towards which the window edges are aligned.
   * @param dir The edge of the window that shall be shrinked or extended.
   * @param mode Whether to shrink or extend the window.
   */
  resizeWindow(
    target: Meta.Window,
    gridSize: GridSize,
    dir: CardinalDirection,
    mode: "extend" | "shrink"
  ) {
    const
      strategy = mode === "extend" ? "shrink" : "grow",
      frameFit = this.windowToSelection(target, gridSize, strategy),
      targetSelection = adjust(frameFit, gridSize, dir, mode),
      monitorIdx = target.get_monitor(),
      targetArea = this.selectionToArea(targetSelection, gridSize, monitorIdx),
      frame = this.#frameRect(target);

    let rect: Rectangle;
    switch (dir) {
      case "north": {
        const height = frame.y + frame.height - targetArea.y;
        rect = { x: frame.x, y: targetArea.y, width: frame.width, height };
        break;
      }
      case "south": {
        const height = targetArea.y + targetArea.height - frame.y;
        rect = { x: frame.x, y: frame.y, width: frame.width, height };
        break;
      }
      case "east": {
        const width = targetArea.x + targetArea.width - frame.x;
        rect = { x: frame.x, y: frame.y, width, height: frame.height };
        break;
      }
      case "west": {
        const width = frame.x + frame.width - targetArea.x;
        rect = { x: targetArea.x, y: frame.y, width, height: frame.height };
        break
      }
    }

    this.#fit(target, rect);
  }

  #dispatch(event: DesktopEvent) {
    for (const cb of this.#dispatchCallbacks) {
      cb(event);
    }
  }

  #moveResize(target: Meta.Window, x: number, y: number, size?: FrameSize) {
    target.unmaximize(Meta.MaximizeFlags.BOTH);

    // All internal calculations fictively operate as if the actual window frame
    // size would also incorporate the user-defined window spacing. Only when a
    // window is actually moved this spacing gets deducted.
    const spacing = this.#userPreferences.getSpacing();
    x += spacing;
    y += spacing;

    // As of Nov '23 the `move_resize_frame` works for almost all application
    // windows. However, a user report pointed out that for gVim, the window is
    // not moved but only resized. The call to `move_frame` fixes that. There
    // doesn't seem to be any other discriminative variable (e.g. window type or
    // frame type) that could serve as an indicator for whether or not this
    // (usually redundant) call is required.
    // https://github.com/gTile/gTile/issues/336#issuecomment-1803025082
    target.move_frame(true, x, y);
    if (size) {
      const { width: w, height: h } = size;
      target.move_resize_frame(true, x, y, w - spacing * 2, h - spacing * 2);
    }
  }

  #fit(target: Meta.Window, { x, y, width, height }: Rectangle) {
    this.#moveResize(target, x, y, { width, height });
  }

  #frameRect(target: Meta.Window): Mtk.Rectangle {
    const frame = target.get_frame_rect();
    const spacing = this.#userPreferences.getSpacing();

    frame.x -= spacing;
    frame.y -= spacing;
    frame.width += spacing * 2;
    frame.height += spacing * 2;

    return frame;
  }

  #workArea(monitorIdx: number): Mtk.Rectangle {
    const
      isPrimaryMonitor = this.#layoutManager.primaryIndex === monitorIdx,
      inset = this.#userPreferences.getInset(isPrimaryMonitor),
      workArea = this.#workspaceManager
        .get_active_workspace()
        .get_work_area_for_monitor(monitorIdx),
      top = Math.clamp(inset.top, 0, Math.floor(workArea.height / 2)),
      bottom = Math.clamp(inset.bottom, 0, Math.floor(workArea.height / 2)),
      left = Math.clamp(inset.left, 0, Math.floor(workArea.width / 2)),
      right = Math.clamp(inset.right, 0, Math.floor(workArea.width / 2)),
      spacing = this.#userPreferences.getSpacing();

    // The fictitious expansion of the workarea by the user-configured spacing
    // effectively acts as a countermeasure so that windows do always align with
    // the screen edge, i.e., unless the user explicitly configured an inset.
    workArea.x += left - spacing;
    workArea.y += top - spacing;
    workArea.width -= left + right - spacing * 2;
    workArea.height -= top + bottom - spacing * 2;

    return workArea;
  }

  #rectToSelection(
    { x, y, width, height }: Rectangle,
    { cols, rows }: GridSize,
    snap: "closest" | "shrink" | "grow",
    ε: number = .01,
  ): GridSelection {
    const
      roundNear = (n: number, ε: number) =>
        Math.abs(n - Math.round(n)) <= ε ? Math.round(n) : n,
      exactNwX = Math.clamp(roundNear(cols * x, ε), 0, cols - 1),
      exactNwY = Math.clamp(roundNear(rows * y, ε), 0, rows - 1),
      exactSeX = Math.clamp(roundNear(cols * (x + width), ε), 1, cols),
      exactSeY = Math.clamp(roundNear(rows * (y + height), ε), 1, rows);

    const discretize =
      snap === "shrink" ? Math.floor : snap === "grow" ? Math.ceil : Math.round;
    const transformNW = (n: number) => n * (snap === "closest" ? 1 : -1);
    let alignedNwX = transformNW(discretize(transformNW(exactNwX)));
    let alignedNwY = transformNW(discretize(transformNW(exactNwY)));
    let alignedSeX = discretize(exactSeX);
    let alignedSeY = discretize(exactSeY);

    // For the "closest" and "shrink" strategies it is possible that the NW and
    // the SE corner collapse to the same grid line on either axis. Resolve this
    // by fallback to the "grow" strategy and let one of the corners expand to
    // the next distant grid line, based on whichever one is closer to the next
    // line.
    if (alignedNwX === alignedSeX) {
      const NwXAlt = transformNW(Math.ceil(transformNW(exactNwX)));
      const SeXAlt = Math.ceil(exactSeX);

      // Might happen for very slim windows on low dimensional grids
      if (NwXAlt === SeXAlt) {
        alignedSeX += 1;
      } else if (Math.abs(NwXAlt - exactNwX) < Math.abs(SeXAlt - exactSeX)) {
        alignedNwX = NwXAlt;
      } else {
        alignedSeX = SeXAlt;
      }
    }

    if (alignedNwY === alignedSeY) {
      const NwYAlt = transformNW(Math.ceil(transformNW(exactNwY)));
      const SeYAlt = Math.ceil(exactSeY);

      if (NwYAlt === SeYAlt) {
        alignedSeY += 1;
      } else if (Math.abs(NwYAlt - exactNwY) < Math.abs(SeYAlt - exactSeY)) {
        alignedNwY = NwYAlt;
      } else {
        alignedSeY = SeYAlt;
      }
    }

    return {
      anchor: { col: alignedNwX, row: alignedNwY },
      target: { col: alignedSeX - 1, row: alignedSeY - 1 },
    };
  }

  #gridSpecToAreas(spec: GridSpec, x = 0, y = 0, w = 1, h = 1): GridSpecAreas {
    const regularCells: Rectangle[] = [];
    const dynamicCells: Rectangle[] = [];
    const totalWeight = spec.cells.reduce((sum, c) => sum + c.weight, 0);

    for (const cell of spec.cells) {
      const ratio = cell.weight / totalWeight;
      const width = spec.mode === "cols" ? w * ratio : w;
      const height = spec.mode === "rows" ? h * ratio : h;

      if (cell.child) {
        const [dedicated, dynamic] =
          this.#gridSpecToAreas(cell.child, x, y, width, height);

        regularCells.push(...dedicated);
        dynamicCells.push(...dynamic);
      } else if (cell.dynamic) {
        dynamicCells.push({ x, y, width, height });
      } else {
        regularCells.push({ x, y, width, height });
      }

      if (spec.mode === "cols") x += width;
      if (spec.mode === "rows") y += height;
    }

    return [regularCells, dynamicCells];
  }

  #splitN(rect: Rectangle, n: number, axis?: "x" | "y"): Rectangle[] {
    const result: Rectangle[] = [];
    const { width, height } = rect;
    axis = axis ?? width > height ? "x" : "y";

    let i = n, { x, y } = rect;
    while (i--) {
      result.push({
        x, y,
        width: axis === "x" ? width / n : width,
        height: axis === "y" ? height / n : height,
      });

      if(axis === "x") x += width / n;
      if(axis === "y") y += height / n;
    }

    return result;
  }

  #tree(frame: MRect, bounds: MRect, collisionObjects: MRect[]): Node<MRect> {
    const self: Node<MRect> = { data: bounds };
    if (collisionObjects.length === 0) {
      return self;
    }

    const win = collisionObjects.splice(0, 1)[0];

    const WE = this.#isWestOf(win, frame) ? "west" : "east";
    const optimalFrameX = this.#noCollide(bounds, win, WE);
    self.left = this.#tree(frame, optimalFrameX, collisionObjects.filter(win =>
      optimalFrameX.intersect(win)[0] || optimalFrameX.contains_rect(win)));

    const NS = this.#isNorthOf(win, frame) ? "north" : "south";
    const optimalFrameY = this.#noCollide(bounds, win, NS);
    self.right = this.#tree(frame, optimalFrameY, collisionObjects.filter(win =>
      optimalFrameY.intersect(win)[0] || optimalFrameY.contains_rect(win)));

    return self;
  }

  #findBest(tree: Node<Mtk.Rectangle>): Mtk.Rectangle {
    let left, right;

    if (tree.left) {
      left = this.#findBest(tree.left);
    }
    if (tree.right) {
      right = this.#findBest(tree.right);
    }

    if (!left && !right) return tree.data;
    if (!left && right) return right;
    if (left && !right) return left;
    if (left!.area() > right!.area()) return left!;

    return right!;
  }

  #isWestOf (r: Rectangle, o: Rectangle) { return o.x >= (r.x + r.width); }
  #isEastOf (r: Rectangle, o: Rectangle) { return this.#isWestOf(o, r); }
  #isNorthOf (r: Rectangle, o: Rectangle) { return o.y >= (r.y + r.height); }
  #isSouthOf (r: Rectangle, o: Rectangle) { return this.#isNorthOf(o, r); }

  #noCollide(bounds: MRect, collider: MRect, dir: CardinalDirection): MRect {
    // @ts-ignore - Mtk.Rectangle has an incorrect constructor signature
    const newBounds = new Mtk.Rectangle({
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
    });

    switch (dir) {
      case "east":
        newBounds.width = collider.x - newBounds.x;
        break;
      case "west":
        const oldX = newBounds.x;
        newBounds.x = collider.x + collider.width;
        newBounds.width -= newBounds.x - oldX;
        break;
      case "north":
        const oldY = newBounds.y;
        newBounds.y = collider.y + collider.height;
        newBounds.height -= newBounds.y - oldY;
        break;
      case "south":
        newBounds.height = collider.y - newBounds.y;
    }

    return newBounds;
  }
}
