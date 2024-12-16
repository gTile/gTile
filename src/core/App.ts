import Gio from "gi://Gio";
import Shell from "gi://Shell";

import * as Main from "resource:///org/gnome/shell/ui/main.js";

import {
  Action,
  AutoTileAction,
  HotkeyAction,
  LoopPresetAction,
} from "../types/hotkeys.js";
import {
  BoolSettingKey,
  ExtensionSettings,
  ExtensionSettingsProvider,
  SettingKey,
} from "../types/settings.js";
import { Theme } from "../types/theme.js";
import { Event as OverlayEventType, OverlayEvent } from "../types/overlay.js";
import PanelButton from "../ui/PanelButton.js";
import { GarbageCollection, GarbageCollector } from "../util/gc.js";
import {
  AutoTileLayouts,
  DefaultGridSizes,
  adjust,
  pan,
} from "../util/grid.js";
import {
  GridSizeListParser,
  GridSpec,
  GridSpecParser,
  Preset,
  ResizePresetListParser,
} from "../util/parser.js";
import { VolatileStorage } from "../util/volatile.js";
import DesktopManager from "./DesktopManager.js";
import HotkeyManager, {
  DefaultKeyBindingGroups,
  SettingKeyToKeyBindingGroupLUT,
} from "./HotkeyManager.js";
import OverlayManager from "./OverlayManager.js";
import UserPreferences from "./UserPreferences.js";

type PresetIndex = [index: number, subindex: number];
type StripPrefix<S extends string> = S extends `${string}-${infer U}` ? U : S;
type StartsWith<S extends string, Prefix extends string> =
  S extends `${Prefix}${string}` ? S : never;
type GridSpecSettingKey = StartsWith<SettingKey, "autotile-gridspec-">;

/**
 * Represents the gTile extension.
 *
 * The class acts as top-level orchestrator. It is responsible to
 * (1) create required instances, e.g. for UI management and keyboard shortcuts
 * (2) listen & react to relevant events, e.g., user inputs, window focus, etc.
 */
export default class App implements GarbageCollector {
  static #instance: App;

  #theme: Theme;
  #gc: GarbageCollection;
  #lastPresetIndex: VolatileStorage<PresetIndex>;
  #settings: ExtensionSettings;
  #gridSpecs: ReturnType<typeof AutoTileLayouts>;
  #globalKeyBindingGroups: number;
  #hotkeyManager: HotkeyManager;
  #desktopManager: DesktopManager;
  #overlayManager: OverlayManager;
  #panelIcon: InstanceType<typeof PanelButton>;

  /**
   * Creates a new singleton instance.
   *
   * The {@link release} method must be called when disposing the instance. It
   * releases all resources that are bound globally and would otherwise continue
   * to exist, such as event subscriptions and UI elements. The instance must
   * not be used thereafter.
   *
   * @param extension The extension instance created by the Gnome environment.
   * @returns The app instance.
   */
  static run(extension: ExtensionSettingsProvider) {
    if (this.#instance) {
      throw new Error("App must have at most one instance.");
    }

    return this.#instance = new this(extension);
  }

  private constructor(extension: ExtensionSettingsProvider) {
    // --- initialize ---
    const mangledThemeName = extension.settings
      .get_string("theme")!
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-") as StripPrefix<Theme>;

    this.#theme = `gtile-${mangledThemeName}`;
    this.#gc = new GarbageCollection();
    this.#lastPresetIndex = new VolatileStorage<PresetIndex>(2000);
    this.#settings = extension.settings;
    this.#gridSpecs = AutoTileLayouts(this.#settings);

    this.#globalKeyBindingGroups = Object
      .entries(SettingKeyToKeyBindingGroupLUT)
      .reduce((mask, [key, group]) =>
        this.#settings.get_boolean(key as BoolSettingKey)
          ? mask | group
          : mask,
        0);

    this.#hotkeyManager = new HotkeyManager({
      settings: this.#settings,
      windowManager: Main.wm,
    });
    this.#gc.defer(() => this.#hotkeyManager.release());

    this.#desktopManager = new DesktopManager({
      shell: Shell.Global.get(),
      display: Shell.Global.get().display,
      layoutManager: Main.layoutManager,
      monitorManager: Shell.Global.get().backend.get_monitor_manager(),
      workspaceManager: Shell.Global.get().workspace_manager,
      userPreferences: new UserPreferences({ settings: this.#settings }),
    });
    this.#gc.defer(() => this.#desktopManager.release());

    const gridSizeConf = this.#settings.get_string("grid-sizes") ?? "";
    this.#overlayManager = new OverlayManager({
      theme: this.#theme,
      settings: this.#settings,
      gnomeSettings: extension.getSettings("org.gnome.desktop.interface"),
      presets: new GridSizeListParser(gridSizeConf).parse() ?? DefaultGridSizes,
      layoutManager: Main.layoutManager,
      desktopManager: this.#desktopManager,
    });
    this.#gc.defer(() => this.#overlayManager.release());

    this.#panelIcon = new PanelButton({ theme: this.#theme });
    this.#gc.defer(() => this.#panelIcon.destroy());

    // --- show  UI ---
    Main.panel.addToStatusArea(extension.uuid, this.#panelIcon);

    // --- event handlers ---
    this.#panelIcon.connect("button-press-event",
      () => this.#onUserAction({ type: Action.TOGGLE }));
    this.#settings.bind("show-icon", this.#panelIcon, "visible",
      Gio.SettingsBindFlags.GET);
    const chid = this.#settings.connect("changed",
      (_, key: SettingKey) => this.#onSettingsChanged(key));
    this.#gc.defer(() => this.#settings.disconnect(chid));
    this.#overlayManager.subscribe(this.#onOverlayEvent.bind(this));
    this.#hotkeyManager.subscribe(this.#onUserAction.bind(this));
    this.#hotkeyManager.setListeningGroups(this.#globalKeyBindingGroups);
  }

  release() {
    this.#gc.release();
    this.#lastPresetIndex.release();
    App.#instance = undefined as any;
  }

  #getResizePreset(index: LoopPresetAction["preset"]): Preset | null {
    const config = this.#settings.get_string(`resize${index}`) ?? "";
    const presets = new ResizePresetListParser(config).parse();
    if (!presets || presets.length === 0) {
      return null;
    }

    const [lastIndex, lastSubindex] = this.#lastPresetIndex.store ?? [-1, -1];
    if (lastIndex !== index) {
      this.#lastPresetIndex.store = [index, 0];

      return presets[0];
    }

    const nextSubindex = (lastSubindex + 1) % presets.length;
    this.#lastPresetIndex.store = [index, nextSubindex];

    return presets[nextSubindex];
  }

  #getAutotilePreset(action: AutoTileAction): GridSpec | null {
    const
      gridSpec = action.layout !== "cols"
        ? this.#gridSpecs[action.layout]
        : this.#gridSpecs[action.layout][action.cols],
      [lastIndex, lastSubindex] = this.#lastPresetIndex.store ?? [-1, -1],
      index = ({
        main: 100,
        "main-inverted": 101,
        cols: 102 + (action.layout === "cols" ? action.cols : 0),
      } satisfies Record<AutoTileAction["layout"], number>)[action.layout];

    if (lastIndex !== index) {
      this.#lastPresetIndex.store = [index, 0];

      return gridSpec[0];
    }

    const nextSubindex = (lastSubindex + 1) % gridSpec.length;
    this.#lastPresetIndex.store = [index, nextSubindex];

    return gridSpec[nextSubindex];
  }

  #onSettingsChanged(key: SettingKey) {
    const isHotkeyRelated =
      (key: string): key is keyof typeof SettingKeyToKeyBindingGroupLUT =>
        key in SettingKeyToKeyBindingGroupLUT;
    const isAutotileRelated =
      (key: string): key is GridSpecSettingKey =>
        key.startsWith("autotile-gridspec-");

    isHotkeyRelated(key) && this.#onHotkeyGroupToggle(key);
    isAutotileRelated(key) && this.#onAutotileGridSpecChanged(key);
    key === "grid-sizes" && this.#onPresetsChanged();
  }

  #onHotkeyGroupToggle(key: keyof typeof SettingKeyToKeyBindingGroupLUT) {
    // new bindings apply when the gTile overlay is toggled the next time
    if (this.#settings.get_boolean(key)) {
      this.#globalKeyBindingGroups |= SettingKeyToKeyBindingGroupLUT[key];
    } else {
      this.#globalKeyBindingGroups &= ~SettingKeyToKeyBindingGroupLUT[key];
    }
  }

  #onAutotileGridSpecChanged(key: GridSpecSettingKey) {
    type SuffixOf<T extends string> =
      T extends `${string}-${string}-${infer U extends number}` ? U : never;

    const col = Number(key.split("-").pop()) as SuffixOf<GridSpecSettingKey>;
    const value = this.#settings.get_string(key);
    const gridSpec = new GridSpecParser(value!).parse();
    if (gridSpec) {
      this.#gridSpecs["cols"][col][0] = gridSpec;
    }
  }

  #onPresetsChanged() {
    const gridSizeConf = this.#settings.get_string("grid-sizes") ?? "";
    const gridSizes = new GridSizeListParser(gridSizeConf).parse();

    if (gridSizes && gridSizes.length > 0) {
      this.#overlayManager.presets = gridSizes;
    }
  }

  #onOverlayEvent(action: OverlayEvent) {
    switch (action.type) {
      case OverlayEventType.Selection:
        this.#onUserAction({ type: Action.CONFIRM });
        return;
      case OverlayEventType.Autotile:
        this.#onUserAction({ type: Action.AUTOTILE, layout: action.layout });
        return;
      case OverlayEventType.Visibility:
        this.#hotkeyManager.setListeningGroups(action.visible
          ? this.#globalKeyBindingGroups | DefaultKeyBindingGroups
          : this.#globalKeyBindingGroups);
        return;
    }

    // exhaustive switch-case guard
    return ((): never => {})();
  }

  #onUserAction(action: HotkeyAction) {
    // trivial delegation events
    switch (action.type) {
      case Action.TOGGLE:
        this.#overlayManager.toggleOverlays();
        return;
      case Action.CANCEL:
        this.#overlayManager.toggleOverlays(true);
        return;
      case Action.LOOP_GRID_SIZE:
        this.#overlayManager.iteratePreset();
        return;
    }

    const om = this.#overlayManager;
    const dm = this.#desktopManager;
    const window = dm.focusedWindow; if (!window) return;
    const monitorIdx = om.activeMonitor ?? window.get_monitor();
    const selection = om.getSelection(monitorIdx);

    // events that require a window target
    switch (action.type) {
      case Action.CONFIRM:
        if (selection) {
          dm.applySelection(window, monitorIdx, om.gridSize, selection);
          om.setSelection(null, monitorIdx);
          this.#settings.get_boolean("auto-close") && om.toggleOverlays(true);
        }
        return;
      case Action.PAN:
        const curSel = selection ?? dm.windowToSelection(window, om.gridSize);
        const newSel = pan(curSel, om.gridSize, action.dir);
        om.setSelection(newSel, monitorIdx);
        return;
      case Action.ADJUST: {
        const curSel = selection ?? dm.windowToSelection(window, om.gridSize);
        const newSel = adjust(curSel, om.gridSize, action.dir, action.mode);
        om.setSelection(newSel, monitorIdx);
        return;
      }
      case Action.MOVE: {
        dm.moveWindow(window, om.gridSize, action.dir);
        return;
      }
      case Action.RESIZE: {
        dm.resizeWindow(window, om.gridSize, action.dir, action.mode);
        return;
      }
      case Action.GROW:
        dm.autogrow(window);
        return;
      case Action.LOOP_PRESET: {
        const preset = this.#getResizePreset(action.preset);
        if (preset) {
          const { gridSize, selection } = preset;
          const targetCursorMonitor =
            this.#settings.get_boolean("target-presets-to-monitor-of-mouse");
          const mIdx = targetCursorMonitor ? dm.pointerMonitorIdx : monitorIdx;
          dm.applySelection(window, mIdx, gridSize, selection);
        }
        return;
      }
      case Action.RELOCATE:
        dm.moveToMonitor(window);
        return;
      case Action.AUTOTILE:
        const gridSpec = this.#getAutotilePreset(action);

        if (gridSpec) {
          dm.autotile(gridSpec, monitorIdx);
        }
        return;
    }

    // exhaustive switch-case guard
    return ((): never => {})();
  }
}
