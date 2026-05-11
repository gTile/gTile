import Gio from "gi://Gio";
import Meta from "gi://Meta";
import St from "gi://St";

import type { LayoutManager } from "resource:///org/gnome/shell/ui/layout.js";

import { Event as DesktopEventType, DesktopEvent } from "../types/desktop.js";
import { GridSelection, GridSize } from "../types/grid.js";
import { DispatchFn, Publisher } from "../types/observable.js";
import { Event, OverlayEvent } from "../types/overlay.js";
import {
  BoolSettingKey,
  ExtensionSettings,
  NamedSettings,
} from "../types/settings.js";
import ThemeStore from "../util/ThemeStore.js";
import Overlay from "../ui/Overlay.js";
import IconButton, { IconButtonParams } from "../ui/overlay/IconButton.js";
import Preview from "../ui/Preview.js";
import { GarbageCollection, GarbageCollector } from "../util/gc.js";
import DesktopManager from "./DesktopManager.js";

export type GnomeInterfaceSettings =
  NamedSettings<"enable-animations", never, never, never, "text-scaling-factor">;

export interface OverlayManagerParams {
  themeStore: ThemeStore;
  settings: ExtensionSettings;
  gnomeSettings: GnomeInterfaceSettings;
  presets: GridSize[];
  layoutManager: LayoutManager;
  desktopManager: DesktopManager;
  showActionButtons?: boolean;
  showPresetButtons?: boolean;
}

/**
 * Responsible for rendering the gTile user interface(s).
 *
 * Keeps track of the connected monitors and renders one overlay per screen.
 * Also keeps the UIs in sync and provides a unified programmatic interface to
 * manipulate the overlay appearance.
 */
export default class implements Publisher<OverlayEvent>, GarbageCollector {
  #themeStore: ThemeStore;
  #showActionButtons: boolean;
  #showPresetButtons: boolean;
  #settings: ExtensionSettings;
  #gnomeSettings: GnomeInterfaceSettings;
  #presets: GridSize[];
  #layoutManager: LayoutManager;
  #desktopManager: DesktopManager;
  #gridLineOverlayGc: GarbageCollection;
  #overlayBindingsGc: GarbageCollection;
  #windowSubscriptionGc: GarbageCollection;
  #dispatchCallbacks: DispatchFn<OverlayEvent>[];
  #overlays: InstanceType<typeof Overlay>[];
  #preview: InstanceType<typeof Preview>;
  #activeIdx: number | null;
  #syncInProgress: boolean;
  #textScalingSignalId = 0;
  #baseFontSizeSignalId = 0;
  #unsubscribeDesktop: () => void;

  constructor({
    themeStore,
    settings,
    gnomeSettings,
    presets,
    layoutManager,
    desktopManager,
    showActionButtons = true,
    showPresetButtons = true,
  }: OverlayManagerParams) {
    this.#themeStore = themeStore;
    this.#showActionButtons = showActionButtons;
    this.#showPresetButtons = showPresetButtons;
    this.#settings = settings;
    this.#gnomeSettings = gnomeSettings;
    this.#presets = presets;
    this.#layoutManager = layoutManager;
    this.#desktopManager = desktopManager;
    this.#gridLineOverlayGc = new GarbageCollection();
    this.#overlayBindingsGc = new GarbageCollection();
    this.#windowSubscriptionGc = new GarbageCollection();
    this.#dispatchCallbacks = [];
    this.#overlays = [];
    this.#preview = new Preview({ themeStore: this.#themeStore });
    this.#activeIdx = null;
    this.#syncInProgress = false;

    this.#unsubscribeDesktop = desktopManager.subscribe(this.#onDesktopEvent.bind(this));
    gnomeSettings.bind(
      "enable-animations", this.#preview, "animate", Gio.SettingsBindFlags.GET);
    this.#textScalingSignalId = gnomeSettings.connect(
      "changed::text-scaling-factor", () => this.#applyFontSize());
    this.#baseFontSizeSignalId = settings.connect(
      "changed::base-font-size", () => this.#applyFontSize());

    layoutManager.addTopChrome(this.#preview);
    this.#renderOverlays();
  }

  /**
   * Must be called prior to disposing the instance. It destroys any existing
   * overlays (hidden and visible). The instance must not be used thereafter.
   */
  release() {
    this.#unsubscribeDesktop();
    this.#gnomeSettings.disconnect(this.#textScalingSignalId);
    this.#settings.disconnect(this.#baseFontSizeSignalId);
    this.#gridLineOverlayGc.release();
    this.#overlayBindingsGc.release();
    this.#windowSubscriptionGc.release();
    this.#destroyOverlays();
    this.#preview.release();
    Gio.Settings.unbind(this.#preview, "animate");
    this.#preview.destroy();
    this.#dispatchCallbacks = [];
  }

  /**
   * Whether to show action buttons. Hot-reloads by adding/removing container.
   */
  set showActionButtons(showActionButtons: boolean) {
    if (this.#showActionButtons === showActionButtons) return;
    this.#showActionButtons = showActionButtons;
    this.#overlays.forEach(overlay => overlay.showActionButtons = showActionButtons);
  }

  /**
   * Whether to show preset buttons. Hot-reloads by adding/removing container.
   */
  set showPresetButtons(showPresetButtons: boolean) {
    if (this.#showPresetButtons === showPresetButtons) return;
    this.#showPresetButtons = showPresetButtons;
    this.#overlays.forEach(overlay => overlay.showPresetButtons = showPresetButtons);
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

  /**
   * Tracks the index of the monitor whose overlay had most recently fired a
   * grid selection event. It can be assumed that this is the overlay that the
   * user interacted with most recently.
   */
  get activeMonitor(): number | null {
    return this.#activeIdx;
  }

  subscribe(fn: DispatchFn<OverlayEvent>): () => void {
    this.#dispatchCallbacks.push(fn);
    return () => {
      this.#dispatchCallbacks = this.#dispatchCallbacks.filter(cb => cb !== fn);
    };
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

    if (this.#settings.get_boolean("follow-cursor")) {
      this.#placeOverlays();
    } else {
      this.#placeOverlays(window);
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
        themeStore: this.#themeStore,
        title: "gTile",
        presets: this.#presets,
        gridAspectRatio: monitor.workArea.width / monitor.workArea.height,
        showActionButtons: this.#showActionButtons,
        showPresetButtons: this.#showPresetButtons,
        visible: false,
      });
      this.#gnomeSettings.bind(
        "enable-animations", overlay, "animate", Gio.SettingsBindFlags.GET);
      this.#overlayBindingsGc.defer(
        () => Gio.Settings.unbind(overlay, "animate"));

      type BSK = BoolSettingKey;
      for (const key of ["auto-close", "follow-cursor"] satisfies BSK[]) {
        const btn = new IconButton({
          symbol: key,
          active: this.#settings.get_boolean(key),
          can_focus: false,
          track_hover: false,
        });

        this.#settings.bind(key, btn, "active", Gio.SettingsBindFlags.GET);
        this.#overlayBindingsGc.defer(
          () => Gio.Settings.unbind(btn, "active"));
        btn.connect("clicked", () => { this.#settings.set_boolean(key, !btn.active); });
        overlay.addActionButton(btn);
      }

      type IBP = IconButtonParams["symbol"];
      for (const symbol of ["main-and-list", "two-list"] satisfies IBP[]) {
        const button = new IconButton({ symbol });
        overlay.addActionButton(button);

        const layout = symbol === "two-list" ? "main-inverted" : "main";
        button.connect("clicked", () => {
          this.#dispatch({ type: Event.Autotile, layout });
        });
      }

      // register event handlers
      this.#settings.bind("selection-timeout",
        overlay, "selection-timeout", Gio.SettingsBindFlags.GET);
      this.#overlayBindingsGc.defer(
        () => Gio.Settings.unbind(overlay, "selection-timeout"));
      overlay.connectObject(
        "notify::visible", this.#onGridVisibleChanged.bind(this),
        "notify::grid-size", this.#onGridSizeChanged.bind(this),
        "notify::grid-selection", this.#onGridSelectionChanged.bind(this),
        "notify::grid-hover-tile", this.#onGridHoverTileChanged.bind(this),
        "selected", () => this.#dispatch({
          type: Event.Selection,
          monitorIdx: monitor.index,
          gridSize: overlay.gridSize,
          // Non-null assertion is safe - selection is set while handlers run
          selection: overlay.gridSelection!,
        }),
        this);
      overlay.connect("settings", () => {
        this.#dispatch({ type: Event.Settings });
      });

      this.#layoutManager.addChrome(overlay);

      this.#overlays.push(overlay);
    }

    this.#applyFontSize();
  }

  #applyFontSize() {
    const baseFontSize = this.#settings.get_int("base-font-size");
    const textScalingFactor = this.#gnomeSettings.get_double("text-scaling-factor");
    const px = Math.round(baseFontSize * textScalingFactor);

    for (const overlay of this.#overlays) {
      overlay.baseFontSize = px;
    }
  }

  #destroyOverlays() {
    this.#overlayBindingsGc.release();
    let wasVisible = false;
    for (const overlay of this.#overlays) {
      wasVisible ||= overlay.visible;
      overlay.release();
      overlay.disconnectObject(this);
      this.#layoutManager.removeChrome(overlay);
      overlay.destroy();
    }
    this.#overlays = [];

    if (wasVisible) {
      this.#dispatch({ type: Event.Visibility, visible: false });
    }
  }

  #renderGridPreview(gridSize: GridSize, timeout: number = 1000) {
    if (!this.#settings.get_boolean("show-grid-lines")) {
      return;
    }

    // destroys previous grid in case it wasn't cleaned up by the timeout yet
    this.#gridLineOverlayGc.release();

    for (const { workArea } of this.#desktopManager.monitors) {
      const tileWidth = workArea.width / gridSize.cols;
      const tileHeight = workArea.height / gridSize.rows;

      for (let i = 1; i < gridSize.cols; ++i) {
        const gridLine = new St.BoxLayout({
          style_class: `${this.#themeStore.theme} gtile-grid-lines-preview`,
          x: workArea.x + tileWidth * i,
          y: workArea.y,
          width: 1,
          height: workArea.height,
        });
        this.#gridLineOverlayGc.defer(() => gridLine.destroy());

        this.#layoutManager.addChrome(gridLine);
      }

      for (let i = 1; i < gridSize.rows; ++i) {
        const gridLine = new St.BoxLayout({
          style_class: `${this.#themeStore.theme} gtile-grid-lines-preview`,
          x: workArea.x,
          y: workArea.y + tileHeight * i,
          width: workArea.width,
          height: 1,
        });
        this.#gridLineOverlayGc.defer(() => gridLine.destroy());

        this.#layoutManager.addChrome(gridLine);
      }
    }

    const id = setTimeout(() => this.#gridLineOverlayGc.release(), timeout);
    // prevents out of band execution when queued quickly in succession
    this.#gridLineOverlayGc.defer(() => clearTimeout(id));
  }

  #updateTitle(title: string) {
    for (const overlay of this.#overlays) {
      overlay.title = title;
    };
  }

  #syncTitleWithWindow(window: Meta.Window | null) {
    this.#windowSubscriptionGc.release();

    if (window) {
      this.#updateTitle(window.title ?? "gTile");
      const chid = window.connect("notify::title", () => {
        this.#updateTitle(window.title ?? "gTile");
      });

      this.#windowSubscriptionGc.defer(() => {
        window.disconnect(chid);
      });
    }
  }

  #placeOverlays(focusedWindow?: Meta.Window) {
    const monitors = this.#desktopManager.monitors;

    console.assert(monitors.length === this.#overlays.length,
      `gTile: number of overlays (${this.#overlays.length}) do not match the` +
      `number of monitors(${ monitors.length })`);
    console.assert(
      Math.max(...monitors.map(m => m.index)) === this.#overlays.length - 1,
      `No̱ of overlays do not match no̱ of monitors (${this.#overlays.length})`,
      monitors.map(({ index }) => index));

    const [mouseX, mouseY] = this.#desktopManager.pointer;
    for (const { index, workArea } of monitors) {
      const overlay = this.#overlays[index];

      // Clutter does not lay out hidden actors, so overlay.width/height are 0
      // until the first show(). Force a style+layout pass to get real dimensions.
      overlay.ensure_style();
      const [,, natWidth, natHeight] = overlay.get_preferred_size();
      const overlayWidth = overlay.visible ? overlay.width : (natWidth ?? 0);
      const overlayHeight = overlay.visible ? overlay.height : (natHeight ?? 0);

      const
        xMax = workArea.x + workArea.width - overlayWidth,
        yMax = workArea.y + workArea.height - overlayHeight;

      if (focusedWindow?.get_monitor() === index) {
        const
          frame = focusedWindow.get_frame_rect(),
          anchorX = Math.clamp(frame.x + frame.width / 2 - overlayWidth / 2,
            workArea.x, xMax),
          anchorY = Math.clamp(frame.y + frame.height / 2 - overlayHeight / 2,
            workArea.y, yMax);

        overlay.placeAt(Math.round(anchorX), Math.round(anchorY));
      } else if (
        workArea.x <= mouseX && mouseX <= (workArea.x + workArea.width) &&
        workArea.y <= mouseY && mouseY <= (workArea.y + workArea.height)
      ) {
        overlay.placeAt(
          Math.round(Math.clamp(mouseX - overlayWidth / 2, workArea.x, xMax)),
          Math.round(Math.clamp(mouseY - overlayHeight / 2, workArea.y, yMax)));
      } else {
        // never animate overlays when placed in the center of the screen
        overlay.x = Math.round(workArea.x + workArea.width / 2 - overlayWidth / 2);
        overlay.y = Math.round(workArea.y + workArea.height / 2 - overlayHeight / 2);
      }
    }
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
    if (!source.gridSelection) {
      this.#activeIdx = null;
      this.#preview.previewArea = null;
      return;
    }

    this.#activeIdx = this.#overlays.findIndex(o => o === source);
    this.#preview.previewArea = this.#desktopManager.selectionToArea(
      source.gridSelection, this.gridSize, this.#activeIdx, true);
  }

  #onGridHoverTileChanged(source: InstanceType<typeof Overlay>) {
    if (!source.gridHoverTile) {
      this.#preview.previewArea = null;
      return;
    }

    const monitorIdx = this.#overlays.findIndex(overlay => overlay === source);
    this.#preview.previewArea = this.#desktopManager.selectionToArea({
      anchor: source.gridHoverTile,
      target: source.gridHoverTile,
    }, source.gridSize, monitorIdx, true);
  }

  #onDesktopEvent(event: DesktopEvent) {
    switch (event.type) {
      case DesktopEventType.FOCUS:
        this.#syncTitleWithWindow(event.target);
        if (!event.target) {
          this.toggleOverlays(true);
        } else if (!this.#settings.get_boolean("follow-cursor")) {
          this.#placeOverlays(event.target);
        } else {
          this.#placeOverlays();
        }
        return;

      case DesktopEventType.MONITORS_CHANGED:
        this.#destroyOverlays();
        this.#renderOverlays();
        return;

      case DesktopEventType.OVERVIEW:
        if (event.visible) {
          this.toggleOverlays(true);
        }
        return;
    }

    // exhaustive switch-case guard
    return ((): never => { })();
  }
}
