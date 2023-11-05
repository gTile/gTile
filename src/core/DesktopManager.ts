import { LayoutManager, Monitor } from "@schnz/gnome-shell/src/ui/layout.js";

import Meta from "gi://Meta?version=13";

import { DesktopEvent, Event } from "../types/desktop.js";
import { GridSelection, GridSize, Rectangle } from "../types/grid.js";
import { DispatchFn, Publisher } from "../types/observable.js";
import { GarbageCollection, GarbageCollector } from "../util/gc.js";
import { GridSpec } from "../util/parser.js";
import { UserPreferencesProvider } from "./UserPreferences.js";

// splits computed gridspec cell areas between non-dynamic and dynamic cells
type GridSpecAreas = [dedicated: Rectangle[], dynamic: Rectangle[]];

export interface DesktopManagerParams {
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
  #display: Meta.Display;
  #layoutManager: LayoutManager;
  #workspaceManager: Meta.WorkspaceManager;
  #userPreferences: UserPreferencesProvider;
  #dispatchCallbacks: DispatchFn<DesktopEvent>[];

  constructor({
    display,
    layoutManager,
    monitorManager,
    workspaceManager,
    userPreferences,
  }: DesktopManagerParams) {
    this.#gc = new GarbageCollection();
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
    selection: GridSelection
  ) {
    const projectedArea = this.selectionToArea(selection, gridSize, monitorIdx);

    this.#moveResize(target, projectedArea);
  }

  /**
   * Projects a {@link selection} to an area on the {@link monitorIdx|monitor}.
   *
   * @param selection The selection to be mapped/projected.
   * @param gridSize The reference grid used to divide the monitor’s work area.
   * @param monitorIdx The monitor for which the selection is being mapped.
   * @returns The mapped selection.
   */
  selectionToArea(
    selection: GridSelection,
    gridSize: GridSize,
    monitorIdx: number
  ): Rectangle {
    const
      { cols, rows } = gridSize,
      relX = Math.min(selection.anchor.col, selection.target.col) / cols,
      relY = Math.min(selection.anchor.row, selection.target.row) / rows,
      relW = (Math.abs(selection.anchor.col - selection.target.col) + 1) / cols,
      relH = (Math.abs(selection.anchor.row - selection.target.row) + 1) / rows;

    const workArea = this.#workspaceManager
      .get_active_workspace()
      .get_work_area_for_monitor(monitorIdx);

    return {
      x: workArea.x + workArea.width * relX,
      y: workArea.y + workArea.height * relY,
      width: workArea.width * relW,
      height: workArea.height * relH,
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
   * @returns The mapped selection.
   */
  windowToSelection(window: Meta.Window, gridSize: GridSize): GridSelection {
    const monitorIdx = window.get_monitor();
    console.assert(monitorIdx >= 0, "gTile: no monitor association for window");
    const workArea = this.#workspaceManager
      .get_active_workspace()
      .get_work_area_for_monitor(monitorIdx);

    const frame = window.get_frame_rect();
    const relativeX = (frame.x - workArea.x) / workArea.width;
    const relativeY = (frame.y - workArea.y) / workArea.height;
    const relativeWidth = frame.width / workArea.width;
    const relativeHeight = frame.height / workArea.height;

    const { cols, rows } = gridSize;
    const gridAnchorX = Math.floor(cols * relativeX);
    const gridAnchorY = Math.floor(rows * relativeY);
    const gridTargetX = Math.ceil(cols * (relativeX + relativeWidth)) - 1;
    const gridTargetY = Math.ceil(rows * (relativeY + relativeHeight)) - 1;

    return {
      anchor: { col: gridAnchorX, row: gridAnchorY },
      target: { col: gridTargetX, row: gridTargetY },
    };
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
    const workspace = this.#workspaceManager.get_active_workspace();
    const workArea = workspace.get_work_area_for_monitor(monitorIdx);
    const windows = workspace.list_windows();

    const project = (relRect: Rectangle, targetRect: Rectangle): Rectangle => ({
      x: targetRect.x + targetRect.width * relRect.x,
      y: targetRect.y + targetRect.height * relRect.y,
      width: targetRect.width * relRect.width,
      height: targetRect.height * relRect.height,
    });

    // Place focused window in the largest dedicated area
    const focusedIdx = windows.findIndex(w => w.has_focus());
    if (focusedIdx && dedicated.length > 0) {
      const [largestIdx] = dedicated.reduce(([accuIdx, accuArea], rect, idx) =>
        rect.width * rect.height > accuArea
          ? [idx, rect.width * rect.height]
          : [accuIdx, accuArea],
        [-1, 0]);

      const projectedArea = project(dedicated[largestIdx], workArea);
      this.#moveResize(windows[focusedIdx], projectedArea);

      windows.splice(focusedIdx, 1);
      dedicated.splice(largestIdx, 1);
    }

    // Place windows in regular cells
    for (let i = 0; i < dedicated.length && i < windows.length; ++i) {
      this.#moveResize(windows[i], project(dedicated[i], workArea));
    }

    // Fit remaining windows in dynamic cells
    windows.splice(0, dedicated.length);
    for (let i = 0; i < dynamic.length; i++) {
      const mustFitAtLeastN = Math.floor(windows.length / dynamic.length);
      const mustTakeOverflowWindow = i < (windows.length % dynamic.length);
      const n = mustFitAtLeastN + (mustTakeOverflowWindow ? 1 : 0);

      let j = i;
      for (const area of this.#subdivideN(dynamic[i], n)) {
        this.#moveResize(windows[j], project(area, workArea));
        j += dynamic.length;
      }
    }
  }

  #dispatch(event: DesktopEvent) {
    for (const cb of this.#dispatchCallbacks) {
      cb(event);
    }
  }

  #isPrimaryMonitor(index: number): boolean {
    return this.#layoutManager.primaryIndex === index;
  }

  #moveResize(target: Meta.Window, { x, y, width, height }: Rectangle) {
    target.move_resize_frame(true, x, y, width, height);
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

  #subdivideN(rect: Rectangle, n: number, axis?: "x" | "y"): Rectangle[] {
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
}
