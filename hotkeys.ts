import {log} from './logging';
import { KeyBindingSettingName } from './settings_data';

declare const global: any;

// Library imports
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import Meta from 'gi://Meta?version=13'
import Shell from 'gi://Shell?version=13';

// Extension imports
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Settings = Me.imports.settings;

/**
 * Bindings is a dictionary that maps a hotkey name to a function that handles
 * the press of the key that is bound to that action.
 */
export type Bindings = Map<KeyBindingSettingName, () => void>;

export type BindingsOld = {[name in KeyBindingSettingName]: () => void};

export function bind(keyBindings: Bindings) {
    log("Binding keys");
    let mySettings = Settings.get();

    keyBindings.forEach((callback: () => void, key: KeyBindingSettingName) => {
        //const key = keyString as KeyBindingSettingName;
        if (Main.wm.addKeybinding && Shell.ActionMode) { // introduced in 3.16
            Main.wm.addKeybinding(
                key,
                mySettings,
                Meta.KeyBindingFlags.NONE,
                Shell.ActionMode.NORMAL,
                callback
            );
        }
        else if (Main.wm.addKeybinding && Shell.KeyBindingMode) { // introduced in 3.7.5
            Main.wm.addKeybinding(
                key,
                mySettings,
                Meta.KeyBindingFlags.NONE,
                Shell.KeyBindingMode.NORMAL | Shell.KeyBindingMode.MESSAGE_TRAY,
                callback
            );
        }
        else {
            global.display.add_keybinding(
                key,
                mySettings,
                Meta.KeyBindingFlags.NONE,
                callback
            );
        }
    });
}

export function unbind(keyBindings: Bindings) {
    log("Unbinding keys");
    for (let key of keyBindings.keys()) {
        if (Main.wm.removeKeybinding) { // introduced in 3.7.2
            Main.wm.removeKeybinding(key);
        }
        else {
            global.display.remove_keybinding(key);
        }
    }
}
