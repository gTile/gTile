// GENERATED CODE: DO NOT EDIT
//
// Run extract_settings_type_definitions instead.


// Valid boolean settings
export type BoolSettingName = (
    "animation" |
    "auto-close" |
    "auto-close-keyboard-shortcut" |
    "debug" |
    "global-auto-tiling" |
    "global-presets" |
    "moveresize-enabled" |
    "show-grid-lines" |
    "show-icon" |
    "target-presets-to-monitor-of-mouse" |
    "window-margin-fullscreen-enabled");

// A setting name for a number-valued setting.
export type NumberSettingName = (
    "insets-primary-bottom" |
    "insets-primary-left" |
    "insets-primary-right" |
    "insets-primary-top" |
    "insets-secondary-bottom" |
    "insets-secondary-left" |
    "insets-secondary-right" |
    "insets-secondary-top" |
    "max-timeout" |
    "window-margin");

// A setting for a key binding i.e. a 'preset' in the app.ts code.
export type KeyBindingSettingName = (
    "action-autotile-main" |
    "action-change-tiling" |
    "action-contract-bottom" |
    "action-contract-left" |
    "action-contract-right" |
    "action-contract-top" |
    "action-expand-bottom" |
    "action-expand-left" |
    "action-expand-right" |
    "action-expand-top" |
    "action-move-down" |
    "action-move-left" |
    "action-move-next-monitor" |
    "action-move-right" |
    "action-move-up" |
    "autotile-1" |
    "autotile-10" |
    "autotile-2" |
    "autotile-3" |
    "autotile-4" |
    "autotile-5" |
    "autotile-6" |
    "autotile-7" |
    "autotile-8" |
    "autotile-9" |
    "autotile-main" |
    "cancel-tiling" |
    "change-grid-size" |
    "move-down" |
    "move-down-vi" |
    "move-left" |
    "move-left-vi" |
    "move-next-monitor" |
    "move-right" |
    "move-right-vi" |
    "move-up" |
    "move-up-vi" |
    "preset-resize-1" |
    "preset-resize-10" |
    "preset-resize-11" |
    "preset-resize-12" |
    "preset-resize-13" |
    "preset-resize-14" |
    "preset-resize-15" |
    "preset-resize-16" |
    "preset-resize-17" |
    "preset-resize-18" |
    "preset-resize-19" |
    "preset-resize-2" |
    "preset-resize-20" |
    "preset-resize-21" |
    "preset-resize-22" |
    "preset-resize-23" |
    "preset-resize-24" |
    "preset-resize-25" |
    "preset-resize-26" |
    "preset-resize-27" |
    "preset-resize-28" |
    "preset-resize-29" |
    "preset-resize-3" |
    "preset-resize-30" |
    "preset-resize-4" |
    "preset-resize-5" |
    "preset-resize-6" |
    "preset-resize-7" |
    "preset-resize-8" |
    "preset-resize-9" |
    "resize-down" |
    "resize-down-vi" |
    "resize-left" |
    "resize-left-vi" |
    "resize-right" |
    "resize-right-vi" |
    "resize-up" |
    "resize-up-vi" |
    "set-tiling" |
    "show-toggle-tiling" |
    "show-toggle-tiling-alt" |
    "snap-to-neighbors" |
    "themes");

// A setting name for a string-valued setting.
export type StringSettingName = (
    "grid-sizes" |
    "main-window-sizes" |
    "resize1" |
    "resize10" |
    "resize11" |
    "resize12" |
    "resize13" |
    "resize14" |
    "resize15" |
    "resize16" |
    "resize17" |
    "resize18" |
    "resize19" |
    "resize2" |
    "resize20" |
    "resize21" |
    "resize22" |
    "resize23" |
    "resize24" |
    "resize25" |
    "resize26" |
    "resize27" |
    "resize28" |
    "resize29" |
    "resize3" |
    "resize30" |
    "resize4" |
    "resize5" |
    "resize6" |
    "resize7" |
    "resize8" |
    "resize9" |
    "theme");

// Any valid setting name.
export type AnySettingName = (
    "action-autotile-main" |
    "action-change-tiling" |
    "action-contract-bottom" |
    "action-contract-left" |
    "action-contract-right" |
    "action-contract-top" |
    "action-expand-bottom" |
    "action-expand-left" |
    "action-expand-right" |
    "action-expand-top" |
    "action-move-down" |
    "action-move-left" |
    "action-move-next-monitor" |
    "action-move-right" |
    "action-move-up" |
    "animation" |
    "auto-close" |
    "auto-close-keyboard-shortcut" |
    "autotile-1" |
    "autotile-10" |
    "autotile-2" |
    "autotile-3" |
    "autotile-4" |
    "autotile-5" |
    "autotile-6" |
    "autotile-7" |
    "autotile-8" |
    "autotile-9" |
    "autotile-main" |
    "cancel-tiling" |
    "change-grid-size" |
    "debug" |
    "global-auto-tiling" |
    "global-presets" |
    "grid-sizes" |
    "insets-primary-bottom" |
    "insets-primary-left" |
    "insets-primary-right" |
    "insets-primary-top" |
    "insets-secondary-bottom" |
    "insets-secondary-left" |
    "insets-secondary-right" |
    "insets-secondary-top" |
    "main-window-sizes" |
    "max-timeout" |
    "move-down" |
    "move-down-vi" |
    "move-left" |
    "move-left-vi" |
    "move-next-monitor" |
    "move-right" |
    "move-right-vi" |
    "move-up" |
    "move-up-vi" |
    "moveresize-enabled" |
    "preset-resize-1" |
    "preset-resize-10" |
    "preset-resize-11" |
    "preset-resize-12" |
    "preset-resize-13" |
    "preset-resize-14" |
    "preset-resize-15" |
    "preset-resize-16" |
    "preset-resize-17" |
    "preset-resize-18" |
    "preset-resize-19" |
    "preset-resize-2" |
    "preset-resize-20" |
    "preset-resize-21" |
    "preset-resize-22" |
    "preset-resize-23" |
    "preset-resize-24" |
    "preset-resize-25" |
    "preset-resize-26" |
    "preset-resize-27" |
    "preset-resize-28" |
    "preset-resize-29" |
    "preset-resize-3" |
    "preset-resize-30" |
    "preset-resize-4" |
    "preset-resize-5" |
    "preset-resize-6" |
    "preset-resize-7" |
    "preset-resize-8" |
    "preset-resize-9" |
    "resize-down" |
    "resize-down-vi" |
    "resize-left" |
    "resize-left-vi" |
    "resize-right" |
    "resize-right-vi" |
    "resize-up" |
    "resize-up-vi" |
    "resize1" |
    "resize10" |
    "resize11" |
    "resize12" |
    "resize13" |
    "resize14" |
    "resize15" |
    "resize16" |
    "resize17" |
    "resize18" |
    "resize19" |
    "resize2" |
    "resize20" |
    "resize21" |
    "resize22" |
    "resize23" |
    "resize24" |
    "resize25" |
    "resize26" |
    "resize27" |
    "resize28" |
    "resize29" |
    "resize3" |
    "resize30" |
    "resize4" |
    "resize5" |
    "resize6" |
    "resize7" |
    "resize8" |
    "resize9" |
    "set-tiling" |
    "show-grid-lines" |
    "show-icon" |
    "show-toggle-tiling" |
    "show-toggle-tiling-alt" |
    "snap-to-neighbors" |
    "target-presets-to-monitor-of-mouse" |
    "theme" |
    "themes" |
    "window-margin" |
    "window-margin-fullscreen-enabled");

interface RawConfigObject {
    /** Global autotile with main window. */
    ["action-autotile-main"]: string[];

    /** Global change grid size. */
    ["action-change-tiling"]: string[];

    /** Global contract bottom edge. */
    ["action-contract-bottom"]: string[];

    /** Global contract left edge. */
    ["action-contract-left"]: string[];

    /** Global contract right edge. */
    ["action-contract-right"]: string[];

    /** Global contract top edge. */
    ["action-contract-top"]: string[];

    /** Global expand bottom edge. */
    ["action-expand-bottom"]: string[];

    /** Global expand left edge. */
    ["action-expand-left"]: string[];

    /** Global expand right edge. */
    ["action-expand-right"]: string[];

    /** Global expand top edge. */
    ["action-expand-top"]: string[];

    /** Global move window down. */
    ["action-move-down"]: string[];

    /** Global move window left. */
    ["action-move-left"]: string[];

    /** Global move window to next monitor. */
    ["action-move-next-monitor"]: string[];

    /** Global move window right. */
    ["action-move-right"]: string[];

    /** Global move window up. */
    ["action-move-up"]: string[];

    /** Make background slection highlight to move more smooth. */
    ["animation"]: boolean;

    /** Close gTile after window have been resized. */
    ["auto-close"]: boolean;

    /** Close gTile after window has been resized using a keyboard shortcut. */
    ["auto-close-keyboard-shortcut"]: boolean;

    /** Autotile 1 column. */
    ["autotile-1"]: string[];

    /** Autotile 10 columns. */
    ["autotile-10"]: string[];

    /** Autotile 2 columns. */
    ["autotile-2"]: string[];

    /** Autotile 3 columns. */
    ["autotile-3"]: string[];

    /** Autotile 4 columns. */
    ["autotile-4"]: string[];

    /** Autotile 5 columns. */
    ["autotile-5"]: string[];

    /** Autotile 6 columns. */
    ["autotile-6"]: string[];

    /** Autotile 7 columns. */
    ["autotile-7"]: string[];

    /** Autotile 8 columns. */
    ["autotile-8"]: string[];

    /** Autotile 9 columns. */
    ["autotile-9"]: string[];

    /** Autotile with main window. */
    ["autotile-main"]: string[];

    /** Cancel tiling. */
    ["cancel-tiling"]: string[];

    /** Loop through grid sizes. */
    ["change-grid-size"]: string[];

    /** Put debug lines into global.log. To see, run journalctl /usr/bin/gnome-shell -f in terminal */
    ["debug"]: boolean;

    /** Auto tiling keyboard hotkeys are always active (as opposed active only when tiling window is visible). */
    ["global-auto-tiling"]: boolean;

    /** Keyboard presets are always active (as opposed active only when tiling window is visible). */
    ["global-presets"]: boolean;

    /** Comma-separated list of grid sizes (like 8x6,4x4,6x4,17x11). */
    ["grid-sizes"]: string;

    /** Bottom gap around border of screen for primary monitor */
    ["insets-primary-bottom"]: number;

    /** Left gap around border of screen for primary monitor */
    ["insets-primary-left"]: number;

    /** Right gap around border of screen for primary monitor */
    ["insets-primary-right"]: number;

    /** Top gap around border of screen for primary monitor */
    ["insets-primary-top"]: number;

    /** Bottom gap around border of screen for secondary monitor */
    ["insets-secondary-bottom"]: number;

    /** Left gap around border of screen for secondary monitor */
    ["insets-secondary-left"]: number;

    /** Right gap around border of screen for secondary monitor */
    ["insets-secondary-right"]: number;

    /** Top gap around border of screen for secondary monitor */
    ["insets-secondary-top"]: number;

    /** "Autotile Main window sizes. (Ratio of the screen to take up. Can be a decimal or a ratio). */
    ["main-window-sizes"]: string;

    /** Maximum timeout in milliseconds between consecutive preset calls to trigger preset cycling. */
    ["max-timeout"]: number;

    /** Move window down. */
    ["move-down"]: string[];

    /** Move window down. */
    ["move-down-vi"]: string[];

    /** Move window left. */
    ["move-left"]: string[];

    /** Move window left. */
    ["move-left-vi"]: string[];

    /** Move window to next monitor. */
    ["move-next-monitor"]: string[];

    /** Move window right. */
    ["move-right"]: string[];

    /** Move window right. */
    ["move-right-vi"]: string[];

    /** Move window up. */
    ["move-up"]: string[];

    /** Move window up. */
    ["move-up-vi"]: string[];

    /** Enables shortcuts for moving and resizing the current window. */
    ["moveresize-enabled"]: boolean;

    /** Preset resize 1. */
    ["preset-resize-1"]: string[];

    /** Preset resize 1. */
    ["preset-resize-10"]: string[];

    /** Preset resize 11. */
    ["preset-resize-11"]: string[];

    /** Preset resize 12. */
    ["preset-resize-12"]: string[];

    /** Preset resize 13. */
    ["preset-resize-13"]: string[];

    /** Preset resize 14. */
    ["preset-resize-14"]: string[];

    /** Preset resize 15. */
    ["preset-resize-15"]: string[];

    /** Preset resize 16. */
    ["preset-resize-16"]: string[];

    /** Preset resize 17. */
    ["preset-resize-17"]: string[];

    /** Preset resize 18. */
    ["preset-resize-18"]: string[];

    /** Preset resize 19. */
    ["preset-resize-19"]: string[];

    /** Preset resize 2. */
    ["preset-resize-2"]: string[];

    /** Preset resize 20. */
    ["preset-resize-20"]: string[];

    /** Preset resize 21. */
    ["preset-resize-21"]: string[];

    /** Preset resize 22. */
    ["preset-resize-22"]: string[];

    /** Preset resize 23. */
    ["preset-resize-23"]: string[];

    /** Preset resize 24. */
    ["preset-resize-24"]: string[];

    /** Preset resize 25. */
    ["preset-resize-25"]: string[];

    /** Preset resize 26. */
    ["preset-resize-26"]: string[];

    /** Preset resize 27. */
    ["preset-resize-27"]: string[];

    /** Preset resize 28. */
    ["preset-resize-28"]: string[];

    /** Preset resize 29. */
    ["preset-resize-29"]: string[];

    /** Preset resize 3. */
    ["preset-resize-3"]: string[];

    /** Preset resize 30. */
    ["preset-resize-30"]: string[];

    /** Preset resize 4. */
    ["preset-resize-4"]: string[];

    /** Preset resize 5. */
    ["preset-resize-5"]: string[];

    /** Preset resize 6. */
    ["preset-resize-6"]: string[];

    /** Preset resize 7. */
    ["preset-resize-7"]: string[];

    /** Preset resize 8. */
    ["preset-resize-8"]: string[];

    /** Preset resize 9. */
    ["preset-resize-9"]: string[];

    /** Resize window - decrease height. */
    ["resize-down"]: string[];

    /** Resize window - decrease height. */
    ["resize-down-vi"]: string[];

    /** Resize window - increase width. */
    ["resize-left"]: string[];

    /** Resize window - increase width. */
    ["resize-left-vi"]: string[];

    /** Resize window - decrease width. */
    ["resize-right"]: string[];

    /** Resize window - decrease width. */
    ["resize-right-vi"]: string[];

    /** Resize window - increase height. */
    ["resize-up"]: string[];

    /** Resize window - increase height. */
    ["resize-up-vi"]: string[];

    /** Preset resize1 settings (example 6x4 1:2 3:3). */
    ["resize1"]: string;

    /** Preset resize10 settings. */
    ["resize10"]: string;

    /** Preset resize11 settings. */
    ["resize11"]: string;

    /** Preset resize12 settings. */
    ["resize12"]: string;

    /** Preset resize13 settings. */
    ["resize13"]: string;

    /** Preset resize14 settings. */
    ["resize14"]: string;

    /** Preset resize15 settings. */
    ["resize15"]: string;

    /** Preset resize16 settings. */
    ["resize16"]: string;

    /** Preset resize17 settings. */
    ["resize17"]: string;

    /** Preset resize18 settings. */
    ["resize18"]: string;

    /** Preset resize19 settings. */
    ["resize19"]: string;

    /** Preset resize2 settings. */
    ["resize2"]: string;

    /** Preset resize20 settings. */
    ["resize20"]: string;

    /** Preset resize21 settings. */
    ["resize21"]: string;

    /** Preset resize22 settings. */
    ["resize22"]: string;

    /** Preset resize23 settings. */
    ["resize23"]: string;

    /** Preset resize24 settings. */
    ["resize24"]: string;

    /** Preset resize25 settings. */
    ["resize25"]: string;

    /** Preset resize26 settings. */
    ["resize26"]: string;

    /** Preset resize27 settings. */
    ["resize27"]: string;

    /** Preset resize28 settings. */
    ["resize28"]: string;

    /** Preset resize29 settings. */
    ["resize29"]: string;

    /** Preset resize3 settings. */
    ["resize3"]: string;

    /** Preset resize30 settings. */
    ["resize30"]: string;

    /** Preset resize4 settings. */
    ["resize4"]: string;

    /** Preset resize5 settings. */
    ["resize5"]: string;

    /** Preset resize6 settings. */
    ["resize6"]: string;

    /** Preset resize7 settings. */
    ["resize7"]: string;

    /** Preset resize8 settings. */
    ["resize8"]: string;

    /** Preset resize9 settings. */
    ["resize9"]: string;

    /** Tile window according to selection. */
    ["set-tiling"]: string[];

    /** Show grid lines when changing grid size */
    ["show-grid-lines"]: boolean;

    /** Show gTile icon on a panel. */
    ["show-icon"]: boolean;

    /** The key you want to activate gTile. */
    ["show-toggle-tiling"]: string[];

    /** AlternativegTile activation key. */
    ["show-toggle-tiling-alt"]: string[];

    /** Snap window size to neighbors */
    ["snap-to-neighbors"]: string[];

    /** Keyboard shortcuts will target the monitor where the mouse curser is. */
    ["target-presets-to-monitor-of-mouse"]: boolean;

    /** Active theme. */
    ["theme"]: string;

    /** You can add or remove themes. Element classes are automatically changed by theme name. */
    ["themes"]: string[];

    /** Gaps between windows in the middle of screen */
    ["window-margin"]: number;

    /** Apply margin to fullscreen windows */
    ["window-margin-fullscreen-enabled"]: boolean;
}
    