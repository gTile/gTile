import Gio from "gi://Gio?version=2.0";
import Shell from "gi://Shell?version=13";

import * as Main from "resource:///org/gnome/shell/ui/main.js";

import { Event as DesktopEventType, DesktopEvent } from "../types/desktop.js";
import { Action, HotkeyAction, LoopPresetAction } from "../types/hotkeys.js";
import {
  BoolSettingKey,
  ExtensionSettings,
  ExtensionSettingsProvider,
  SettingKey
} from "../types/settings.js";
import { Theme } from "../types/theme.js";
import { Event as OverlayEventType, OverlayEvent } from "../types/overlay.js";
import PanelButton from "../ui/PanelButton.js";
import { GarbageCollection, GarbageCollector } from "../util/gc.js";
import { DefaultGridSizes, adjust, pan } from "../util/grid.js";
import {
  GridSizeListParser,
  Preset,
  ResizePresetListParser
} from "../util/parser.js";
import { VolatileStorage } from "../util/volatile.js";
import DesktopManager from "./DesktopManager.js";
import HotkeyManager, { KeyBindingGroup } from "./HotkeyManager.js";
import OverlayManager from "./OverlayManager.js";
import UserPreferences from "./UserPreferences.js";

type StripPrefix<S extends string> = S extends `${string}-${infer U}` ? U : S;
type ResizePresetAddr = [index: number, subindex: number];

const settingKeyToKeyBindingGroup = {
  "global-auto-tiling": KeyBindingGroup.Autotile,
  "global-presets": KeyBindingGroup.Preset,
  "moveresize-enabled": KeyBindingGroup.Action,
} as const satisfies Partial<Record<BoolSettingKey, KeyBindingGroup>>;

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
  #lastResizePreset: VolatileStorage<ResizePresetAddr>;
  #settings: ExtensionSettings;
  #enabledKeyBindingGroups: number;
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
    const mangledThemeName = extension.settings.
      get_string("theme")!.
      toLowerCase().
      replace(/[^a-z0-9]/g, "-") as StripPrefix<Theme>;

    this.#theme = `gtile-${mangledThemeName}`;
    this.#gc = new GarbageCollection();
    this.#lastResizePreset = new VolatileStorage<ResizePresetAddr>(2000);
    this.#settings = extension.settings;
    this.#enabledKeyBindingGroups = Object
      .entries(settingKeyToKeyBindingGroup)
      .reduce((mask, [key, group]) =>
        this.#settings.get_boolean(key as BoolSettingKey)
          ? mask | group
          : mask,
        KeyBindingGroup.Overlay);

    this.#hotkeyManager = new HotkeyManager({
      settings: this.#settings,
      windowManager: Main.wm,
    });
    this.#gc.defer(() => this.#hotkeyManager.release());

    this.#desktopManager = new DesktopManager({
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
      gnomeSettings: extension.getSettings('org.gnome.desktop.interface'),
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
    this.#desktopManager.subscribe(this.#onDesktopEvent.bind(this));
    this.#overlayManager.subscribe(this.#onOverlayEvent.bind(this));
    this.#hotkeyManager.subscribe(this.#onUserAction.bind(this));
  }

  release() {
    this.#gc.release();
    App.#instance = undefined as any;
  }

  #getResizePreset(index: LoopPresetAction["preset"]): Preset | null {
    const config = this.#settings.get_string(`resize${index}`) ?? "";
    const presets = new ResizePresetListParser(config).parse();
    if (!presets || presets.length === 0) {
      return null;
    }

    const [lastIndex, lastSubindex] = this.#lastResizePreset.store ?? [-1, -1];
    if (lastIndex !== index) {
      this.#lastResizePreset.store = [index, 0];

      return presets[0];
    }

    const nextSubindex = (lastSubindex + 1) % presets.length;
    this.#lastResizePreset.store = [index, nextSubindex];

    return presets[nextSubindex];
  }

  #onSettingsChanged(key: SettingKey) {
    const isHotkeyRelated =
      (key: string): key is keyof typeof settingKeyToKeyBindingGroup =>
        key in settingKeyToKeyBindingGroup;

    isHotkeyRelated(key) && this.#onHotkeyGroupToggle(key);
    key === "grid-sizes" && this.#onPresetsChanged();
  }

  #onHotkeyGroupToggle(key: keyof typeof settingKeyToKeyBindingGroup) {
    // new bindings apply when the gTile overlay is opened the next time
    if (this.#settings.get_boolean(key)) {
      this.#enabledKeyBindingGroups |= settingKeyToKeyBindingGroup[key];
    } else {
      this.#enabledKeyBindingGroups &= ~settingKeyToKeyBindingGroup[key];
    }
  }

  #onPresetsChanged() {
    const gridSizeConf = this.#settings.get_string("grid-sizes") ?? "";
    const gridSizes = new GridSizeListParser(gridSizeConf).parse();

    if (gridSizes && gridSizes.length > 0) {
      this.#overlayManager.presets = gridSizes;
    }
  }

  #onDesktopEvent(action: DesktopEvent) {
    switch (action.type) {
      case DesktopEventType.FOCUS: return;
      case DesktopEventType.MONITORS_CHANGED: return;
    }

    // exhaustive switch-case guard
    return ((): never => { })();
  }

  #onOverlayEvent(action: OverlayEvent) {
    switch (action.type) {
      case OverlayEventType.Selection:
        // confirming a selection by mouse is handled the same as with <Enter>
        this.#onUserAction({ type: Action.CONFIRM });
        return;
      case OverlayEventType.Visibility:
        this.#hotkeyManager.setListeningGroups(
          action.visible ? this.#enabledKeyBindingGroups : 0);
        return;
    }

    // exhaustive switch-case guard
    return ((): never => { })();
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
    const monitorIdx = window.get_monitor();
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
        if (!selection) {
          const newSelection = dm.windowToSelection(window, om.gridSize);
          om.setSelection(newSelection, window.get_monitor());
        } else {
          const newSelection = pan(selection, om.gridSize, action.dir);
          om.setSelection(newSelection, monitorIdx);
        }
        return;
      case Action.ADJUST:
        const curSel = selection ?? dm.windowToSelection(window, om.gridSize);
        const adaptedSel = adjust(curSel, om.gridSize, action.dir, action.mode);
        om.setSelection(adaptedSel, monitorIdx);
        return;
      case Action.RESIZE: return;
      case Action.GROW: return;
      case Action.LOOP_PRESET: {
        const preset = this.#getResizePreset(action.preset);
        if (preset) {
          const { gridSize, selection } = preset;
          this.#desktopManager.applySelection(window, monitorIdx, gridSize, selection);
        }
        return;
      }
      case Action.RELOCATE: return;
      case Action.AUTOTILE: return;
    }

    // exhaustive switch-case guard
    return ((): never => { })();
  }
}
