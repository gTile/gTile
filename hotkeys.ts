import {log} from './logging';

declare const imports: any;
declare const global: any;

// Library imports
const Main = imports.ui.main;
const Meta = imports.gi.Meta;
const Shell = imports.gi.Shell;

// Extension imports
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Settings = Me.imports.settings;

// Globals
const mySettings = Settings.get();

/**
 * Bindings is a dictionary that maps a hotkey name to a function that handles
 * the press of the key that is bound to that action.
 */
export type Bindings = {[name: string]: () => void};

export function bind(keyBindings: Bindings) {
    log("Binding keys");
    for (var key in keyBindings) {
        if (Main.wm.addKeybinding && Shell.ActionMode) { // introduced in 3.16
            Main.wm.addKeybinding(
                key,
                mySettings,
                Meta.KeyBindingFlags.NONE,
                Shell.ActionMode.NORMAL,
                keyBindings[key]
            );
        }
        else if (Main.wm.addKeybinding && Shell.KeyBindingMode) { // introduced in 3.7.5
            Main.wm.addKeybinding(
                key,
                mySettings,
                Meta.KeyBindingFlags.NONE,
                Shell.KeyBindingMode.NORMAL | Shell.KeyBindingMode.MESSAGE_TRAY,
                keyBindings[key]
            );
        }
        else {
            global.display.add_keybinding(
                key,
                mySettings,
                Meta.KeyBindingFlags.NONE,
                keyBindings[key]
            );
        }
    }
}

export function unbind(keyBindings: Bindings) {
    log("Unbinding keys");
    for (var key in keyBindings) {
        if (Main.wm.removeKeybinding) { // introduced in 3.7.2
            Main.wm.removeKeybinding(key);
        }
        else {
            global.display.remove_keybinding(key);
        }
    }
}
