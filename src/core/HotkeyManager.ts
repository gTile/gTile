import Meta from "gi://Meta?version=13";
import Shell from "gi://Shell?version=13";

import { WindowManager } from "resource:///org/gnome/shell/ui/windowManager.js";

import { Action, HotkeyAction, ResizeAction } from "../types/hotkeys.js";
import { DispatchFn, Publisher } from "../types/observable.js";
import {
  BoolSettingKey,
  ExtensionSettings,
  KeyBindingGlobalSettingKey,
  KeyBindingGroupActionSettingKey,
  KeyBindingGroupAutotileSettingKey,
  KeyBindingGroupDefaultSettingKey,
  KeyBindingGroupPresetSettingKey,
} from "../types/settings.js";
import { GarbageCollector } from "../util/gc.js";

type KeyBindingGroupSettingKeys<G extends number> =
  G extends KeyBindingGroup.Global ? KeyBindingGlobalSettingKey :
  G extends KeyBindingGroup.Overlay ? KeyBindingGroupDefaultSettingKey :
  G extends KeyBindingGroup.Autotile ? KeyBindingGroupAutotileSettingKey :
  G extends KeyBindingGroup.Action ? KeyBindingGroupActionSettingKey :
  G extends KeyBindingGroup.Preset ? KeyBindingGroupPresetSettingKey :
  never;

/**
 * Used to identify groups of related keyboard shortcuts that can be
 * (de)activated together. The enum members act as bitflags and can be added to
 * represent multiple groups. `Global`-group shortcuts are always enabled.
 */
export const enum KeyBindingGroup {
  Global   = 1 << 0,
  Overlay  = 1 << 1,
  Autotile = 1 << 2,
  Action   = 1 << 3,
  Preset   = 1 << 4,
}

/**
 * The default keybinding groups that are active when overlay is shown.
 */
export const DefaultKeyBindingGroups =
  KeyBindingGroup.Overlay | KeyBindingGroup.Autotile | KeyBindingGroup.Preset;

/**
 * Setting keys that control whether specific keybinding groups are always
 * active, even when the overlay is hidden.
 */
export const SettingKeyToKeyBindingGroupLUT = {
  "global-auto-tiling": KeyBindingGroup.Autotile,
  "global-presets": KeyBindingGroup.Preset,
  "moveresize-enabled": KeyBindingGroup.Action,
} as const satisfies Partial<Record<BoolSettingKey, KeyBindingGroup>>;

export interface HotkeyManagerParams {
  settings: ExtensionSettings
  windowManager: WindowManager;
}

/**
 * Responsible for intercepting gTile-related keyboard shortcuts.
 *
 * Immediately registers a few always-enabled keyboard shortcuts upon
 * instantiation. Additional shortcuts can be enabled/disabled conditionally,
 * e.g., whenever the gTile overlay is shown.
 */
export default class implements Publisher<HotkeyAction>, GarbageCollector {
  #settings: ExtensionSettings;
  #windowManager: WindowManager;
  #bindings: Record<KeyBindingGroup, Set<string>>;
  #dispatchCallbacks: DispatchFn<HotkeyAction>[];
  #keyBindingGroupMask: number;

  constructor({ settings, windowManager }: HotkeyManagerParams) {
    this.#settings = settings;
    this.#windowManager = windowManager;
    this.#bindings = {
      [KeyBindingGroup.Global]: new Set(),
      [KeyBindingGroup.Overlay]: new Set(),
      [KeyBindingGroup.Autotile]: new Set(),
      [KeyBindingGroup.Action]: new Set(),
      [KeyBindingGroup.Preset]: new Set(),
    };
    this.#dispatchCallbacks = [];
    this.#keyBindingGroupMask = KeyBindingGroup.Global;

    this.#registerGlobalHotkeys();
  }

  /**
   * Must be called prior to disposing the class instance. It discontinues event
   * notifications to subscribers and unregisters all keyboard bindings from the
   * Gnome window manager, including those of the {@link KeyBindingGroup.Global}
   * group. The instance must not be used thereafter.
   */
  release() {
    this.#keyBindingGroupMask = 0;
    this.#dispatchCallbacks = [];

    this.#registerGlobalHotkeys();
    this.#registerOverlayHotkeys();
    this.#registerAutotileHotkeys();
    this.#registerActionHotkeys();
    this.#registerPresetHotkeys();
  }

  /**
   * Sets the keyboard shortcut groups that should be listened for. Any group
   * that is not explicitly provided (except {@link KeyBindingGroup.Global})
   * will no longer be listened for, nor will subscribers receive any events
   * for them.
   *
   * @param keybindingGroups The {@link KeyBindingGroup}s that should be active.
   *   The passed groups are logically ORed together. Thus, they can be passed
   *   either as individual arguments, as a bitset, or a mixture of both.
   */
  setListeningGroups(...keybindingGroups: number[]) {
    this.#keyBindingGroupMask = keybindingGroups.reduce(
      (mask, flag) => mask | flag,
      KeyBindingGroup.Global
    );

    this.#registerOverlayHotkeys();
    this.#registerAutotileHotkeys();
    this.#registerActionHotkeys();
    this.#registerPresetHotkeys();
  };

  subscribe(fn: DispatchFn<HotkeyAction>) {
    this.#dispatchCallbacks.push(fn);
  }

  #dispatch(action: HotkeyAction) {
    for (const cb of this.#dispatchCallbacks) {
      cb(action);
    }
  }

  #registerGlobalHotkeys() {
    const kb = (
      name: KeyBindingGroupSettingKeys<KeyBindingGroup.Global>,
      dispatchEvent: HotkeyAction,
    ) => this.#registerKeybinding(KeyBindingGroup.Global, name, () => {
      this.#dispatch(dispatchEvent);
    });

    kb("show-toggle-tiling", { type: Action.TOGGLE });
  }

  #registerOverlayHotkeys() {
    const kb = (
      name: KeyBindingGroupSettingKeys<KeyBindingGroup.Overlay>,
      dispatchEvent: HotkeyAction,
    ) => this.#registerKeybinding(KeyBindingGroup.Overlay, name, () => {
      this.#dispatch(dispatchEvent);
    });

    kb("cancel-tiling", { type: Action.CANCEL });
    kb("change-grid-size", { type: Action.LOOP_GRID_SIZE });
    kb("move-up", { type: Action.PAN, dir: "north" });
    kb("move-right", { type: Action.PAN, dir: "east" });
    kb("move-down", { type: Action.PAN, dir: "south" });
    kb("move-left", { type: Action.PAN, dir: "west" });
    kb("move-next-monitor", { type: Action.RELOCATE });
    kb("resize-up", { type: Action.ADJUST, mode: "shrink", dir: "south" });
    kb("resize-right", { type: Action.ADJUST, mode: "extend", dir: "east" });
    kb("resize-down", { type: Action.ADJUST, mode: "extend", dir: "south" });
    kb("resize-left", { type: Action.ADJUST, mode: "shrink", dir: "east" });
    kb("set-tiling", { type: Action.CONFIRM });
    kb("snap-to-neighbors", { type: Action.GROW });
  }

  #registerAutotileHotkeys() {
    const kb = (
      name: KeyBindingGroupSettingKeys<KeyBindingGroup.Autotile>,
      dispatchEvent: HotkeyAction,
    ) => this.#registerKeybinding(KeyBindingGroup.Autotile, name, () => {
      this.#dispatch(dispatchEvent);
    });

    kb("autotile-main", { type: Action.AUTOTILE, layout: "main" });
    kb("autotile-main-inverted", {
      type: Action.AUTOTILE,
      layout: "main-inverted"
    });
    kb("autotile-1", { type: Action.AUTOTILE, layout: "cols", cols: 1 });
    kb("autotile-2", { type: Action.AUTOTILE, layout: "cols", cols: 2 });
    kb("autotile-3", { type: Action.AUTOTILE, layout: "cols", cols: 3 });
    kb("autotile-4", { type: Action.AUTOTILE, layout: "cols", cols: 4 });
    kb("autotile-5", { type: Action.AUTOTILE, layout: "cols", cols: 5 });
    kb("autotile-6", { type: Action.AUTOTILE, layout: "cols", cols: 6 });
    kb("autotile-7", { type: Action.AUTOTILE, layout: "cols", cols: 7 });
    kb("autotile-8", { type: Action.AUTOTILE, layout: "cols", cols: 8 });
    kb("autotile-9", { type: Action.AUTOTILE, layout: "cols", cols: 9 });
    kb("autotile-10", { type: Action.AUTOTILE, layout: "cols", cols: 10 });
  }

  #registerActionHotkeys() {
    const kb = (
      name: KeyBindingGroupSettingKeys<KeyBindingGroup.Action>,
      dispatchEvent: HotkeyAction,
    ) => this.#registerKeybinding(KeyBindingGroup.Action, name, () => {
      this.#dispatch(dispatchEvent);
    });

    kb("action-autotile-main", { type: Action.AUTOTILE, layout: "main" });
    kb("action-autotile-main-inverted", {
      type: Action.AUTOTILE,
      layout: "main-inverted"
    });
    kb("action-change-tiling", { type: Action.LOOP_GRID_SIZE });
    {
      const mode: ResizeAction["mode"] = "shrink";
      kb("action-contract-top", { type: Action.RESIZE, mode, dir: "north" });
      kb("action-contract-right", { type: Action.RESIZE, mode, dir: "east" });
      kb("action-contract-bottom", { type: Action.RESIZE, mode, dir: "south" });
      kb("action-contract-left", { type: Action.RESIZE, mode, dir: "west" });
    }
    {
      const mode: ResizeAction["mode"] = "extend";
      kb("action-expand-top", { type: Action.RESIZE, mode, dir: "north" });
      kb("action-expand-right", { type: Action.RESIZE, mode, dir: "east" });
      kb("action-expand-bottom", { type: Action.RESIZE, mode, dir: "south" });
      kb("action-expand-left", { type: Action.RESIZE, mode, dir: "west" });
    }
    kb("action-move-up", { type: Action.MOVE, dir: "north" });
    kb("action-move-right", { type: Action.MOVE, dir: "east" });
    kb("action-move-down", { type: Action.MOVE, dir: "south" });
    kb("action-move-left", { type: Action.MOVE, dir: "west" });
    kb("action-move-next-monitor", { type: Action.RELOCATE });
  }

  #registerPresetHotkeys() {
    const kb = (
      name: KeyBindingGroupSettingKeys<KeyBindingGroup.Preset>,
      dispatchEvent: HotkeyAction,
    ) => this.#registerKeybinding(KeyBindingGroup.Preset, name, () => {
      this.#dispatch(dispatchEvent);
    });

    kb("preset-resize-1", { type: Action.LOOP_PRESET, preset: 1 });
    kb("preset-resize-2", { type: Action.LOOP_PRESET, preset: 2 });
    kb("preset-resize-3", { type: Action.LOOP_PRESET, preset: 3 });
    kb("preset-resize-4", { type: Action.LOOP_PRESET, preset: 4 });
    kb("preset-resize-5", { type: Action.LOOP_PRESET, preset: 5 });
    kb("preset-resize-6", { type: Action.LOOP_PRESET, preset: 6 });
    kb("preset-resize-7", { type: Action.LOOP_PRESET, preset: 7 });
    kb("preset-resize-8", { type: Action.LOOP_PRESET, preset: 8 });
    kb("preset-resize-9", { type: Action.LOOP_PRESET, preset: 9 });
    kb("preset-resize-10", { type: Action.LOOP_PRESET, preset: 10 });
    kb("preset-resize-11", { type: Action.LOOP_PRESET, preset: 11 });
    kb("preset-resize-12", { type: Action.LOOP_PRESET, preset: 12 });
    kb("preset-resize-13", { type: Action.LOOP_PRESET, preset: 13 });
    kb("preset-resize-14", { type: Action.LOOP_PRESET, preset: 14 });
    kb("preset-resize-15", { type: Action.LOOP_PRESET, preset: 15 });
    kb("preset-resize-16", { type: Action.LOOP_PRESET, preset: 16 });
    kb("preset-resize-17", { type: Action.LOOP_PRESET, preset: 17 });
    kb("preset-resize-18", { type: Action.LOOP_PRESET, preset: 18 });
    kb("preset-resize-19", { type: Action.LOOP_PRESET, preset: 19 });
    kb("preset-resize-20", { type: Action.LOOP_PRESET, preset: 20 });
    kb("preset-resize-21", { type: Action.LOOP_PRESET, preset: 21 });
    kb("preset-resize-22", { type: Action.LOOP_PRESET, preset: 22 });
    kb("preset-resize-23", { type: Action.LOOP_PRESET, preset: 23 });
    kb("preset-resize-24", { type: Action.LOOP_PRESET, preset: 24 });
    kb("preset-resize-25", { type: Action.LOOP_PRESET, preset: 25 });
    kb("preset-resize-26", { type: Action.LOOP_PRESET, preset: 26 });
    kb("preset-resize-27", { type: Action.LOOP_PRESET, preset: 27 });
    kb("preset-resize-28", { type: Action.LOOP_PRESET, preset: 28 });
    kb("preset-resize-29", { type: Action.LOOP_PRESET, preset: 29 });
    kb("preset-resize-30", { type: Action.LOOP_PRESET, preset: 30 });
  }

  #registerKeybinding<T extends KeyBindingGroup>(
    group: T,
    name: KeyBindingGroupSettingKeys<T>,
    handler: Meta.KeyHandlerFunc
  ) {
    // keybinding group inactive -> unregister binding if it was registered
    if ((group & this.#keyBindingGroupMask) !== group) {
      if (this.#bindings[group].has(name)) {
        this.#bindings[group].delete(name);
        this.#windowManager.removeKeybinding(name);
      }

      return;
    }

    // register keybinding
    if (!this.#bindings[group].has(name)) {
      this.#bindings[group].add(name);
      this.#windowManager.addKeybinding(
        name,
        this.#settings,
        Meta.KeyBindingFlags.NONE,
        Shell.ActionMode.NORMAL,
        handler);
    }
  }
}
