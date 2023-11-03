import { LayoutManager, Monitor } from "@schnz/gnome-shell/src/ui/layout.js";

import Meta from "gi://Meta?version=13";

import { DesktopEvent, Event } from "../types/desktop.js";
import { GridSelection, GridSize, Rectangle } from "../types/grid.js";
import { DispatchFn, Publisher } from "../types/observable.js";
import { GarbageCollection, GarbageCollector } from "../util/gc.js";
import { UserPreferencesProvider } from "./UserPreferences.js";

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

  /**
   * The list of monitors that comprise the desktop.
   */
  get monitors(): Monitor[] {
    return this.#layoutManager.monitors;
  }

  /**
   * The window that is currently in focus.
   */
  get focusedWindow(): Meta.Window | null {
    // current implementation already returns null but since this is not
    // documented, use nullish coalescing for safety.
    return this.#display.focus_window ?? null;
  }

  subscribe(fn: DispatchFn<DesktopEvent>) {
    this.#dispatchCallbacks.push(fn);
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
    const monitor = this.#layoutManager.monitors[monitorIdx];
    console.assert(!!monitor, "gTile: undefined monitor index", monitorIdx);
    const workArea = this.#workspaceManager
      .get_active_workspace()
      .get_work_area_for_monitor(monitorIdx);
    const inset = this.#userPreferences
      .getInset(this.#isPrimaryMonitor(monitorIdx));

    // Revise work area by applying the user specified inset
    const targetArea: Rectangle = {
      x: workArea.x + inset.left,
      y: workArea.y + inset.top,
      width: workArea.width - inset.right,
      height: workArea.height - inset.bottom,
    }

    // map relative selection to absolute workArea
    const noCols = Math.abs(selection.anchor.col - selection.target.col) + 1;
    const noRows = Math.abs(selection.anchor.row - selection.target.row) + 1;
    const relativeOffsetX =
      Math.min(selection.anchor.col, selection.target.col) / gridSize.cols;
    const relativeOffsetY =
      Math.min(selection.anchor.row, selection.target.row) / gridSize.rows;
    const relativeW = noCols / gridSize.cols;
    const relativeH = noRows / gridSize.rows;

    const targetWidth = targetArea.width * relativeW;
    const targetHeight = targetArea.height * relativeH;
    const targetOffsetX = targetArea.x + targetArea.width * relativeOffsetX;
    const targetOffsetY = targetArea.y + targetArea.height * relativeOffsetY;

    target.move_resize_frame(true,
      targetOffsetX,
      targetOffsetY,
      targetWidth,
      targetHeight);
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

  #dispatch(event: DesktopEvent) {
    for (const cb of this.#dispatchCallbacks) {
      cb(event);
    }
  }

  #isPrimaryMonitor(index: number): boolean {
    return this.#layoutManager.primaryIndex === index;
  }
}
