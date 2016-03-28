// Library imports
const Main = imports.ui.main;
const Meta = imports.gi.Meta;
const Shell = imports.gi.Shell;

// Extension imports
const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Settings = Extension.imports.settings;

// Globals
const mySettings = Settings.get();

function bind(key_bindings) {
    global.log("Binding keys");
    for (var key in key_bindings) {
        if (Main.wm.addKeybinding && Shell.ActionMode) { // introduced in 3.16
            Main.wm.addKeybinding(
                key,
                mySettings,
                Meta.KeyBindingFlags.NONE,
                Shell.ActionMode.NORMAL,
                key_bindings[key]
            );
        }
        else if (Main.wm.addKeybinding && Shell.KeyBindingMode) { // introduced in 3.7.5
            Main.wm.addKeybinding(
                key,
                mySettings,
                Meta.KeyBindingFlags.NONE,
                Shell.KeyBindingMode.NORMAL | Shell.KeyBindingMode.MESSAGE_TRAY,
                key_bindings[key]
            );
        }
        else {
            global.display.add_keybinding(
                key,
                mySettings,
                Meta.KeyBindingFlags.NONE,
                key_bindings[key]
            );
        }
    }
}

function unbind(key_bindings) {
    global.log("Unbinding keys");
    for (key in key_bindings) {
        if (Main.wm.removeKeybinding) { // introduced in 3.7.2
            Main.wm.removeKeybinding(key);
        }
        else {
            global.display.remove_keybinding(key);
        }
    }
}
