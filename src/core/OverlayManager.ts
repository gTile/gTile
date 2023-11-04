import { LayoutManager } from "@schnz/gnome-shell/src/ui/layout.js";

import Gio from "gi://Gio?version=2.0";
import Meta from "gi://Meta?version=13";
import St from "gi://St?version=13";

import * as Main from "resource:///org/gnome/shell/ui/main.js";

import { Event as DesktopEventType, DesktopEvent } from "../types/desktop.js";
import { GridSelection, GridSize } from "../types/grid.js";
import { DispatchFn, Publisher } from "../types/observable.js";
import { Event, OverlayEvent } from "../types/overlay.js";
import {
  BoolSettingKey,
  ExtensionSettings,
  NamedSettings,
} from "../types/settings.js";
import { Theme } from "../types/theme.js";
import Overlay from "../ui/Overlay.js";
import IconButton, { IconButtonParams } from "../ui/overlay/IconButton.js";
import Preview from "../ui/Preview.js";
import { GarbageCollection, GarbageCollector } from "../util/gc.js";
import DesktopManager from "./DesktopManager.js";

export type GnomeInterfaceSettings =
  NamedSettings<"enable-animations", never, never>;

export interface OverlayManagerParams {
  theme: Theme;
  settings: ExtensionSettings;
  gnomeSettings: GnomeInterfaceSettings;
  presets: GridSize[];
  layoutManager: LayoutManager;
  desktopManager: DesktopManager
}

/**
 * Responsible for rendering the gTile user interface(s).
 *
 * Keeps track of the connected monitors and renders one overlay per screen.
 * Also keeps the UIs in sync and provides a unified programmatic interface to
 * manipulate the overlay appearance.
 */
export default class implements Publisher<OverlayEvent>, GarbageCollector {
  #gc: GarbageCollection;
  #theme: Theme;
  #settings: ExtensionSettings;
  #presets: GridSize[];
  #layoutManager: LayoutManager;
  #desktopManager: DesktopManager;
  #dispatchCallbacks: DispatchFn<OverlayEvent>[];
  #overlays: InstanceType<typeof Overlay>[];
  #preview: InstanceType<typeof Preview>;
  #syncInProgress: boolean;

  constructor({
    theme,
    settings,
    gnomeSettings,
    presets,
    layoutManager,
    desktopManager
  }: OverlayManagerParams) {
    this.#gc = new GarbageCollection();
    this.#theme = theme;
    this.#settings = settings;
    this.#presets = presets;
    this.#layoutManager = layoutManager;
    this.#desktopManager = desktopManager;
    this.#dispatchCallbacks = [];
    this.#overlays = [];
    this.#preview = new Preview({ theme: this.#theme });
    this.#syncInProgress = false;

    Main.layoutManager.addTopChrome(this.#preview);
    this.#renderOverlays();

    this.#desktopManager.subscribe(this.#onDesktopEvent.bind(this));
    gnomeSettings.bind(
      "enable-animations", this.#preview, "animate", Gio.SettingsBindFlags.GET);
  }

  /**
   * Must be called prior to disposing the instance. It destroys any existing
   * overlays (hidden and visible). The instance must not be used thereafter.
   */
  release() {
    this.#gc.release();
    this.#preview.destroy();
    this.#destroyOverlays();
    this.#dispatchCallbacks = [];
  }

  /**
   * The grid size presets. They are displayed as buttons in the UI which can be
   * clicked to apply the corresponding preset.
   *
   * A change of presets will reset
   *   - the grid selection, if any
   *   - the size of the grid to the first preset in the list, unless the list
   *     contains a preset that matches the currently selected grid size
   */
  set presets(presets: GridSize[]) {
    this.#presets = presets;
    for (const overlay of this.#overlays) {
      overlay.presets = presets;
    }
  }

  get presets() {
    return this.#presets;
  }

  /**
   * The current size of the grid that is shown in the overlays.
   */
  get gridSize(): GridSize {
    return this.#overlays[0].gridSize;
  }

  subscribe(fn: DispatchFn<OverlayEvent>) {
    this.#dispatchCallbacks.push(fn);
  }

  /**
   * Toggles the visibility of the overlays.
   *
   * Overlays can only become (and remain) visible while a window is focused.
   *
   * @param hide Optional. Specify to enfore a visibility state.
   */
  toggleOverlays(hide?: boolean) {
    const visible = hide ?? this.#overlays.some(({ visible }) => visible);

    // hide overlays when visible
    if (visible) {
      this.#syncInProgress = true;
      this.#overlays.forEach(overlay => overlay.hide());
      this.#syncInProgress = false;
      this.#dispatch({ type: Event.Visibility, visible: false });
      return;
    }

    // check pre-conditions for showing overlay
    const window = this.#desktopManager.focusedWindow;
    if (
      !window ||
      window.get_window_type() === Meta.WindowType.DESKTOP ||
      window.get_layer().valueOf() === Meta.StackLayer.DESKTOP ||
      this.#overlays.length === 0
    ) {
      return;
    }

    const monitors = this.#desktopManager.monitors;
    console.assert(monitors.length === this.#overlays.length,
      `gTile: number of overlays (${this.#overlays.length}) do not match the` +
      `number of monitors(${ monitors.length })`);
    console.assert(
      Math.max(...monitors.map(m => m.index)) === this.#overlays.length - 1,
      `No̱ of overlays do not match no̱ of monitors (${this.#overlays.length})`,
      monitors.map(({ index }) => index));

    for (const monitor of monitors) {
      const overlay = this.#overlays[monitor.index];

      if (window.get_monitor() === monitor.index) {
        const rect = window.get_frame_rect();
        overlay.x = rect.x + rect.width / 2 - overlay.width / 2;
        overlay.y = rect.y + rect.height / 2 - overlay.height / 2;
      } else {
        overlay.x = monitor.x + monitor.width / 2 - overlay.width / 2;
        overlay.y = monitor.y + monitor.height / 2 - overlay.height / 2;
      }
    }

    this.#syncInProgress = true;
    this.#overlays.forEach(overlay => overlay.show());
    this.#syncInProgress = false;
    this.#dispatch({ type: Event.Visibility, visible: true });
  }

  /**
   * Overrides the tile selection of the overlay on the specified monitor.
   *
   * @param selection The selection to be set.
   * @param monitorIdx The targeted monitor whose overlay will be updated.
   */
  setSelection(selection: GridSelection | null, monitorIdx: number) {
    this.#overlays[monitorIdx].gridSelection = selection;
  }

  /**
   * Returns the current tile selection of the overlay on the specified monitor.
   *
   * @param monitorIdx The monitor whose overlay should be queried.
   * @returns The tile selection, if any.
   */
  getSelection(monitorIdx: number): GridSelection | null {
    return this.#overlays[monitorIdx].gridSelection;
  }

  /**
   * Rotates (by one iteration at a time) through the grid {@link presets}.
   */
  iteratePreset() {
    this.#syncInProgress = true;
    this.#overlays.forEach(overlay => overlay.iteratePreset());
    this.#syncInProgress = false;

    this.#renderGridPreview(this.#overlays[0].gridSize);
  }

  #dispatch(event: OverlayEvent) {
    for (const cb of this.#dispatchCallbacks) {
      cb(event);
    }
  }

  #renderOverlays() {
    for (const monitor of this.#desktopManager.monitors) {
      const overlay = new Overlay({
        theme: this.#theme,
        title: "gTile",
        presets: this.#presets,
        gridAspectRatio: monitor.width / monitor.height,
        visible: false,
      });

      type BSK = BoolSettingKey;
      for (const key of ["auto-close"] satisfies BSK[]) {
        const btn = new IconButton({
          theme: this.#theme,
          symbol: key,
          active: this.#settings.get_boolean(key),
          can_focus: false,
          track_hover: false,
        });

        this.#settings.bind(key, btn, "active", Gio.SettingsBindFlags.DEFAULT);
        btn.connect("clicked", () => { btn.active = !btn.active; });
        overlay.addActionButton(btn);
      }

      type IBP = IconButtonParams["symbol"];
      for (const symbol of ["main-and-list", "two-list"] satisfies IBP[]) {
        overlay.addActionButton(new IconButton({
          theme: this.#theme,
          symbol,
        }));
      }

      // register event handlers
      overlay.connect("notify::visible", this.#onGridVisibleChanged.bind(this));
      overlay.connect("notify::grid-size", this.#onGridSizeChanged.bind(this));
      overlay.connect("notify::grid-selection",
        this.#onGridSelectionChanged.bind(this));
      overlay.connect("selected", () => this.#dispatch({
        type: Event.Selection,
        monitorIdx: monitor.index,
        gridSize: overlay.gridSize,
        // Non-null assertion is safe - selection is set until handlers complete
        selection: overlay.gridSelection!,
      }));

      this.#layoutManager.addChrome(overlay);

      this.#overlays.push(overlay);
    }
  }

  #destroyOverlays() {
    let overlay: InstanceType<typeof Overlay>, wasVisible = false;
    while (overlay = this.#overlays.pop()!) {
      wasVisible ||= overlay.visible;
      overlay.destroy();
    }

    if (wasVisible) {
      this.#dispatch({ type: Event.Visibility, visible: false });
    }
  }

  #renderGridPreview(gridSize: GridSize, timeout: number = 1000) {
    if (!this.#settings.get_boolean("show-grid-lines")) {
      return;
    }

    // destroys previous grid in case it wasn't cleaned up by the timeout yet
    this.#gc.release();

    for (const monitor of this.#desktopManager.monitors) {
      const tileWidth = monitor.width / gridSize.cols;
      const tileHeight = monitor.height / gridSize.rows;

      for (let i = 1; i < gridSize.cols; ++i) {
        const gridLine = new St.BoxLayout({
          style_class: `${this.#theme}__grid_lines_preview`,
          x: monitor.x + tileWidth * i,
          y: monitor.y,
          width: 1,
          height: monitor.height,
        });
        this.#gc.defer(() => gridLine.destroy());

        this.#layoutManager.addChrome(gridLine);
      }

      for (let i = 1; i < gridSize.rows; ++i) {
        const gridLine = new St.BoxLayout({
          style_class: `${this.#theme}__grid_lines_preview`,
          x: monitor.x,
          y: monitor.y + tileHeight * i,
          width: monitor.width,
          height: 1,
        });
        this.#gc.defer(() => gridLine.destroy());

        this.#layoutManager.addChrome(gridLine);
      }
    }

    const id = setTimeout(() => this.#gc.release(), timeout);
    // prevents out of band execution when queued quickly in succession
    this.#gc.defer(() => clearTimeout(id));
  }

  #onGridVisibleChanged(source: InstanceType<typeof Overlay>) {
    if (this.#syncInProgress) {
      return;
    }

    this.#syncInProgress = true;
    this.#overlays
      .filter(({ visible }) => visible !== source.visible)
      .forEach(o => source.visible ? o.show() : o.hide());
    this.#syncInProgress = false;
    this.#dispatch({ type: Event.Visibility, visible: source.visible });
  }

  #onGridSizeChanged(source: InstanceType<typeof Overlay>) {
    if (this.#syncInProgress) {
      return;
    }

    this.#syncInProgress = true;
    for (const overlay of this.#overlays) {
      if (overlay !== source) {
        overlay.gridSize = source.gridSize;
      }
    }
    this.#syncInProgress = false;

    this.#renderGridPreview(source.gridSize);
  }

  #onGridSelectionChanged(source: InstanceType<typeof Overlay>) {
    if (!this.#desktopManager.focusedWindow) {
      return;
    }

    if (!source.gridSelection) {
      this.#preview.previewArea = null;
      return;
    }

    const monitorIdx = this.#desktopManager.focusedWindow.get_monitor();
    const area = this.#desktopManager
      .selectionToArea(source.gridSelection, this.gridSize, monitorIdx);

    this.#preview.previewArea = area;
  }

  #onDesktopEvent(event: DesktopEvent) {
    switch (event.type) {
      case DesktopEventType.FOCUS:
        if (!event.target) {
          this.toggleOverlays(true);
          return;
        }
        for (const overlay of this.#overlays) {
          overlay.title = event.target.title ?? "gTile";
        }
        return;
      case DesktopEventType.MONITORS_CHANGED:
        this.#destroyOverlays();
        this.#renderOverlays();
        return;
    }

    // exhaustive switch-case guard
    return ((): never => { })();
  }
}
