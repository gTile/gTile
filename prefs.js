'use strict'
// Library imports
const GObject = imports.gi.GObject;
const Gdk = imports.gi.Gdk;
const Gtk = imports.gi.Gtk;
const Gio = imports.gi.Gio;

// Extension imports
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Settings = Me.imports.settings;

// Redefining globals from extension.js - do not know how to do it better :-(
const SETTINGS_GRID_SIZES = 'grid-sizes';
const SETTINGS_AUTO_CLOSE = 'auto-close';
const SETTINGS_AUTO_CLOSE_KEYBOARD_SHORTCUT = "auto-close-keyboard-shortcut";
const SETTINGS_ANIMATION = 'animation';
const SETTINGS_SHOW_ICON = 'show-icon';
const SETTINGS_GLOBAL_AUTO_TILING = 'global-auto-tiling';
const SETTINGS_GLOBAL_PRESETS = 'global-presets';
const SETTINGS_TARGET_PRESETS_TO_MONITOR_OF_MOUSE = "target-presets-to-monitor-of-mouse";
const SETTINGS_MOVERESIZE_ENABLED = 'moveresize-enabled';
const SETTINGS_WINDOW_MARGIN = 'window-margin';
const SETTINGS_WINDOW_MARGIN_FULLSCREEN_ENABLED = 'window-margin-fullscreen-enabled';
const SETTINGS_MAX_TIMEOUT = 'max-timeout';
const SETTINGS_PRESET_RESIZE = 'resize';
const SETTINGS_MAIN_WINDOW_SIZES = 'main-window-sizes';
const SETTINGS_DEBUG = 'debug';
const SETTINGS_SHOW_GRID_LINES = 'show-grid-lines';

const SETTINGS_INSETS_PRIMARY_LEFT = 'insets-primary-left';
const SETTINGS_INSETS_PRIMARY_RIGHT = 'insets-primary-right';
const SETTINGS_INSETS_PRIMARY_TOP = 'insets-primary-top';
const SETTINGS_INSETS_PRIMARY_BOTTOM = 'insets-primary-bottom';

const SETTINGS_INSETS_SECONDARY_LEFT = 'insets-secondary-left';
const SETTINGS_INSETS_SECONDARY_RIGHT = 'insets-secondary-right';
const SETTINGS_INSETS_SECONDARY_TOP = 'insets-secondary-top';
const SETTINGS_INSETS_SECONDARY_BOTTOM = 'insets-secondary-bottom';

const SETTINGS_THEME = 'theme';
const SETTINGS_THEMES = 'themes';

// Globals
const pretty_names = {
    'show-toggle-tiling': 'Display gTile',
    'show-toggle-tiling-alt': 'Display gTile alternative',
    'set-tiling'              : 'Set tiling',
    'cancel-tiling'           : 'Cancel tiling',
    'change-grid-size'        : 'Change grid size',
    'autotile-main'           : 'Autotile Main',
    'autotile-1'              : 'Autotile 1 cols',
    'autotile-2'              : 'Autotile 2 cols',
    'autotile-3'              : 'Autotile 3 cols',
    'autotile-4'              : 'Autotile 4 cols',
    'autotile-5'              : 'Autotile 5 cols',
    'autotile-6'              : 'Autotile 6 cols',
    'autotile-7'              : 'Autotile 7 cols',
    'autotile-8'              : 'Autotile 8 cols',
    'autotile-9'              : 'Autotile 9 cols',
    'autotile-10'             : 'Autotile 10 cols',
    'snap-to-neighbors'       : 'Snap window size to neighbors',
    'preset-resize-1'         : 'Preset resize 1',
    'preset-resize-2'         : 'Preset resize 2',
    'preset-resize-3'         : 'Preset resize 3',
    'preset-resize-4'         : 'Preset resize 4',
    'preset-resize-5'         : 'Preset resize 5',
    'preset-resize-6'         : 'Preset resize 6',
    'preset-resize-7'         : 'Preset resize 7',
    'preset-resize-8'         : 'Preset resize 8',
    'preset-resize-9'         : 'Preset resize 9',
    'preset-resize-10'        : 'Preset resize 10',
    'preset-resize-11'        : 'Preset resize 11',
    'preset-resize-12'        : 'Preset resize 12',
    'preset-resize-13'        : 'Preset resize 13',
    'preset-resize-14'        : 'Preset resize 14',
    'preset-resize-15'        : 'Preset resize 15',
    'preset-resize-16'        : 'Preset resize 16',
    'preset-resize-17'        : 'Preset resize 17',
    'preset-resize-18'        : 'Preset resize 18',
    'preset-resize-19'        : 'Preset resize 19',
    'preset-resize-20'        : 'Preset resize 20',
    'preset-resize-21'        : 'Preset resize 21',
    'preset-resize-22'        : 'Preset resize 22',
    'preset-resize-23'        : 'Preset resize 23',
    'preset-resize-24'        : 'Preset resize 24',
    'preset-resize-25'        : 'Preset resize 25',
    'preset-resize-26'        : 'Preset resize 26',
    'preset-resize-27'        : 'Preset resize 27',
    'preset-resize-28'        : 'Preset resize 28',
    'preset-resize-29'        : 'Preset resize 29',
    'preset-resize-30'        : 'Preset resize 30',
    'action-change-tiling'    : 'Global change grid size',
    'action-contract-bottom'  : 'Global contract bottom edge',
    'action-contract-left'    : 'Global contract left edge',
    'action-contract-right'   : 'Global contract right edge',
    'action-contract-top'     : 'Global contract top edge',
    'action-expand-bottom'    : 'Global expand bottom edge',
    'action-expand-left'      : 'Global expand left edge',
    'action-expand-right'     : 'Global expand right edge',
    'action-expand-top'       : 'Global expand top edge',
    'action-move-down'        : 'Global move window down',
    'action-move-left'        : 'Global move window left',
    'action-move-right'       : 'Global move window right',
    'action-move-up'          : 'Global move window up',
    'action-move-next-monitor': 'Global move window to next monitor',
    'move-left-vi'            : 'Vi-style move left',
    'move-right-vi'           : 'Vi-style move right',
    'move-up-vi'              : 'Vi-style move up',
    'move-down-vi'            : 'Vi-style move down',
    'resize-left-vi'          : 'Vi-style resize narrower',
    'resize-right-vi'         : 'Vi-style resize wider',
    'resize-up-vi'            : 'Vi-style resize taller',
    'resize-down-vi'          : 'Vi-style resize shorter'
}

function set_child(widget, child) {
    if (Gtk.get_major_version() >= 4) {
        widget.set_child(child);
    } else {
        widget.add(child);
    }
}

function box_append(box, child) {
    if (Gtk.get_major_version() >= 4) {
        box.append(child);
    } else {
        box.add(child);
    }
}

function init() {

}

function accel_tab(notebook, settings) {
    let ks_grid = new Gtk.Grid({
        column_spacing: 10,
        orientation: Gtk.Orientation.VERTICAL,
        row_spacing: 10,
    });

    ks_grid.set_margin_start(24);
    ks_grid.set_margin_top(24);

    let model = new Gtk.ListStore();

    model.set_column_types([
        GObject.TYPE_STRING,
        GObject.TYPE_STRING,
        GObject.TYPE_INT,
        GObject.TYPE_INT
    ]);

    for (let key in pretty_names) {
        append_hotkey(model, settings, key, pretty_names[key]);
    }

    let treeview = new Gtk.TreeView({
        'model': model,
        'hexpand': true
    });

    let col;
    let cellrend;

    cellrend = new Gtk.CellRendererText();

    col = new Gtk.TreeViewColumn({
        'title': 'Keybinding',
        'expand': true
    });

    col.pack_start(cellrend, true);
    col.add_attribute(cellrend, 'text', 1);

    treeview.append_column(col);

    cellrend = new Gtk.CellRendererAccel({
        'editable': true,
        'accel-mode': Gtk.CellRendererAccelMode.GTK
    });

    cellrend.connect('accel-cleared', function(rend, str_iter) {
        let [success, iter] = model.get_iter_from_string(str_iter);

        if (!success) {
            throw new Error("Something be broken, yo.");
        }

        let name = model.get_value(iter, 0);
        model.set(iter, [3], [0]);
        settings.set_strv(name, ['']);
    });

    cellrend.connect('accel-edited', function(rend, str_iter, key, mods) {
        let value = Gtk.accelerator_name(key, mods);


        let [success, iter] = model.get_iter_from_string(str_iter);


        if (!success) {
            throw new Error("Something be broken, yo.");
        }

        let name = model.get_value(iter, 0);

        model.set(iter, [ 2, 3 ], [ mods, key ]);

        settings.set_strv(name, [value]);
    });

    col = new Gtk.TreeViewColumn({
        'title': 'Accel'
    });

    col.pack_end(cellrend, false);
    col.add_attribute(cellrend, 'accel-mods', 2);
    col.add_attribute(cellrend, 'accel-key', 3);

    treeview.append_column(col);

    let text = "Keyboard shortcuts. Arrows are used to move window and are not re-assignable.";
    ks_grid.attach_next_to(new Gtk.Label({
        label: text,
        halign: Gtk.Align.START,
        justify: Gtk.Justification.LEFT,
        use_markup: false,
        wrap: true,
    }), null, Gtk.PositionType.BOTTOM, 1, 1);
    ks_grid.attach_next_to(treeview, null, Gtk.PositionType.BOTTOM, 1, 1);

    let ks_window = new Gtk.ScrolledWindow({'vexpand': true});
    set_child(ks_window, ks_grid)
    let ks_label = new Gtk.Label({
        label: "Accelerators",
        halign: Gtk.Align.START,
        use_markup: false,
    });
    notebook.append_page(ks_window, ks_label);
}

function basics_tab(notebook, settings) {

    let bs_grid = new Gtk.Grid({
        column_spacing: 10,
        orientation: Gtk.Orientation.VERTICAL,
        row_spacing: 10,
    });

    bs_grid.set_margin_start(24);
    bs_grid.set_margin_top(24);

    add_check("Auto close on resize", SETTINGS_AUTO_CLOSE, bs_grid, settings);
    add_check("Auto close on keyboard shortcut", SETTINGS_AUTO_CLOSE_KEYBOARD_SHORTCUT, bs_grid, settings);
    add_check("Animation",  SETTINGS_ANIMATION,  bs_grid, settings);
    add_check("Show icon",  SETTINGS_SHOW_ICON,  bs_grid, settings);

    add_text ("Grid sizes (like 6x4,8x6,21x11)", SETTINGS_GRID_SIZES, bs_grid, settings, 30);
    add_check("Global auto tiling hotkeys (works without gTile activated)", SETTINGS_GLOBAL_AUTO_TILING  , bs_grid, settings);
    let globalAutoTilingWarning = '<span foreground="red">Warning: Make sure to change the auto tiling hotkeys when activating this setting, ' +
        'as the default hotkeys use 0-9 and M. This option will bind these hotkeys globally, making them unusable for other functions!</span>';
    let globalAutoTilingWarningLabel = new Gtk.Label({
        label: globalAutoTilingWarning,
        halign: Gtk.Align.START,
        justify: Gtk.Justification.LEFT,
        use_markup: true,
        visible: false,
        wrap: true,
    })
    bs_grid.attach_next_to(globalAutoTilingWarningLabel, null, Gtk.PositionType.BOTTOM, 1, 1)
    settings.connect('changed::'+SETTINGS_GLOBAL_AUTO_TILING, () => {
        globalAutoTilingWarningLabel.visible = settings.get_boolean(SETTINGS_GLOBAL_AUTO_TILING);
    })
    add_check("Global resize presets (works without gTile activated)", SETTINGS_GLOBAL_PRESETS  , bs_grid, settings);
    add_check("Keyboard presets target monitor of mouse", SETTINGS_TARGET_PRESETS_TO_MONITOR_OF_MOUSE, bs_grid, settings);

    add_check("Enable accelerators for moving and resizing windows", SETTINGS_MOVERESIZE_ENABLED  , bs_grid, settings);
    add_check("Show grid lines when changing grid size", SETTINGS_SHOW_GRID_LINES, bs_grid, settings);

    add_int("Maximum timeout for preset cycling (ms)", SETTINGS_MAX_TIMEOUT, bs_grid, settings, 500, 10000, 100, 1000);

    add_text ("Autotile Main window sizes\n(Ratio of the screen to take up. Can be a decimal or a ratio)", SETTINGS_MAIN_WINDOW_SIZES, bs_grid, settings, 30);

    add_check("Debug", SETTINGS_DEBUG    , bs_grid, settings);
    let text = "To see debug messages, in terminal run journalctl /usr/bin/gnome-shell -f";
    bs_grid.attach_next_to(new Gtk.Label({
        label: text,
        halign: Gtk.Align.START,
        justify: Gtk.Justification.LEFT,
        use_markup: false,
        wrap: true,
    }), null, Gtk.PositionType.BOTTOM, 1, 1)

    let bs_window = new Gtk.ScrolledWindow({'vexpand': true});
    set_child(bs_window, bs_grid);
    let bs_label = new Gtk.Label({
        label: "Basic",
        halign: Gtk.Align.START,
        use_markup: false,
    });
    notebook.append_page(bs_window, bs_label);
}

function presets_tab(notebook, settings) {
    let pr_grid = new Gtk.Grid({
        column_spacing: 10,
        orientation: Gtk.Orientation.VERTICAL,
        row_spacing: 10,
    });

    pr_grid.set_margin_start(24);
    pr_grid.set_margin_top(24);

    let text = `
      Resize presets (grid size and 2 corner tiles - 1:1 is top left tile, columns first, e.g. '4x2 3:2 4:2' is right bottom quarter of screen)
      If grid size is omitted, global grid size will be used.
    `;
    pr_grid.attach_next_to(new Gtk.Label({
        label: text,
        halign: Gtk.Align.START,
        justify: Gtk.Justification.LEFT,
        use_markup: false,
        wrap: true,
    }), null, Gtk.PositionType.BOTTOM, 1, 1)

    for (var ind = 1; ind <= 30; ind++) {
        add_text ("Preset resize " + ind, SETTINGS_PRESET_RESIZE + ind, pr_grid, settings, 20);
    }
    let pr_window = new Gtk.ScrolledWindow({'vexpand': true});
    set_child(pr_window, pr_grid);
    let pr_label = new Gtk.Label({
        label: "Resize presets",
        halign: Gtk.Align.START,
        use_markup: false,
    });
    notebook.append_page(pr_window, pr_label);
}

function margins_tab(notebook, settings) {
    let mg_grid = new Gtk.Grid({
        column_spacing: 10,
        orientation: Gtk.Orientation.VERTICAL,
        row_spacing: 10,
    });

    mg_grid.set_margin_start(24);
    mg_grid.set_margin_top(24);

    let text = "Window margins and invisible borders around screen.";
    mg_grid.attach_next_to(new Gtk.Label({
        label: text,
        halign: Gtk.Align.START,
        justify: Gtk.Justification.LEFT,
        use_markup: false,
        wrap: true,
    }), null, Gtk.PositionType.BOTTOM, 1, 1)
    add_check("Apply margin to fullscreen windows", SETTINGS_WINDOW_MARGIN_FULLSCREEN_ENABLED, mg_grid, settings);
    add_int ("Window margin"            , SETTINGS_WINDOW_MARGIN           , mg_grid, settings, 0, 240, 1, 10);
    add_int ("Left margin on primary screen"      , SETTINGS_INSETS_PRIMARY_LEFT     , mg_grid, settings, 0, 240, 1, 10);
    add_int ("Right margin on primary screen"     , SETTINGS_INSETS_PRIMARY_RIGHT    , mg_grid, settings, 0, 240, 1, 10);
    add_int ("Top margin on primary screen"       , SETTINGS_INSETS_PRIMARY_TOP      , mg_grid, settings, 0, 240, 1, 10);
    add_int ("Bottom margin on primary screen"    , SETTINGS_INSETS_PRIMARY_BOTTOM   , mg_grid, settings, 0, 240, 1, 10);
    add_int ("Left margin on secondary screen"    , SETTINGS_INSETS_SECONDARY_LEFT   , mg_grid, settings, 0, 240, 1, 10);
    add_int ("Right margin on secondary screen"   , SETTINGS_INSETS_SECONDARY_RIGHT  , mg_grid, settings, 0, 240, 1, 10);
    add_int ("Top margin on secondary screen"     , SETTINGS_INSETS_SECONDARY_TOP    , mg_grid, settings, 0, 240, 1, 10);
    add_int ("Bottom margin on secondary screen"  , SETTINGS_INSETS_SECONDARY_BOTTOM , mg_grid, settings, 0, 240, 1, 10);

    let mg_window = new Gtk.ScrolledWindow({'vexpand': true});
    set_child(mg_window, mg_grid);
    let mg_label = new Gtk.Label({
        label: "Margins",
        halign: Gtk.Align.START,
        use_markup: false,
    });
    notebook.append_page(mg_window, mg_label);
}

function help_tab(notebook) {
    let weblink = 'https://github.com/gTile/gTile/blob/master/README.md';
    let hl_link =  new Gtk.LinkButton({
        label: weblink,
        uri: weblink,
        halign: Gtk.Align.CENTER,
        valign: Gtk.Align.CENTER,
    });
    let hl_label = new Gtk.Label({
        label: "Help",
        halign: Gtk.Align.START,
        use_markup: false,
    });
    notebook.append_page(hl_link, hl_label);
}

function theme_tab(notebook, settings) {
    const options = settings.get_strv(SETTINGS_THEMES);

    const grid = new Gtk.Grid({
      column_spacing: 10,
      orientation: Gtk.Orientation.VERTICAL,
      row_spacing: 10,
    });

    grid.set_margin_start(24);
    grid.set_margin_top(24);

    grid.attach_next_to(new Gtk.Label({
      label: 'Theme',
      halign: Gtk.Align.START,
      justify: Gtk.Justification.LEFT,
      use_markup: false,
      wrap: true,
    }), null, Gtk.PositionType.BOTTOM, 1, 1)

    let themes = add_combobox(options, grid, function (active) {
      settings.set_string(SETTINGS_THEME, active);
    });

    const active = settings.get_string(SETTINGS_THEME);

    themes.set_active(options.indexOf(active) || 0);

    let window = new Gtk.ScrolledWindow({ 'vexpand': true });

    set_child(window, grid);
    let label = new Gtk.Label({
      label: "Theme",
      halign: Gtk.Align.START,
      use_markup: false,
    });

    notebook.append_page(window, label);
}

function buildPrefsWidget() {

    let notebook = new Gtk.Notebook();
    let settings = Settings.get();


    basics_tab(notebook, settings);
    theme_tab(notebook, settings);
    accel_tab(notebook, settings);
    presets_tab(notebook, settings);
    margins_tab(notebook, settings);
    help_tab(notebook);

    let main_vbox = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        spacing: 10,
        'width-request': 820,
        'height-request': 600
    });

    if (Gtk.get_major_version() >= 4) {
        main_vbox.prepend(notebook);
    } else {
        main_vbox.pack_start(notebook, true, true, 0);
        main_vbox.show_all();
    }

    return main_vbox;
}

function add_check(check_label, SETTINGS, grid, settings) {
    let check = new Gtk.CheckButton({ label: check_label, margin_top: 6 });
    settings.bind(SETTINGS, check, 'active', Gio.SettingsBindFlags.DEFAULT);
    grid.attach_next_to(check, null, Gtk.PositionType.BOTTOM, 1, 1);
}

function add_int(int_label, SETTINGS, grid, settings, minv, maxv, incre, page) {
    let item = new IntSelect(int_label);
    item.set_args(minv, maxv, incre, page);
    settings.bind(SETTINGS, item.spin, 'value', Gio.SettingsBindFlags.DEFAULT);
    grid.attach_next_to(item.actor, null, Gtk.PositionType.BOTTOM, 1, 1);
}

function add_text(text_label, SETTINGS, grid, settings, width) {
    let item = new TextEntry(text_label);
    item.set_args(width);
    settings.bind(SETTINGS, item.textentry, 'text', Gio.SettingsBindFlags.DEFAULT);
    grid.attach_next_to(item.actor, null, Gtk.PositionType.BOTTOM, 1, 1);
}

function add_combobox(options, grid, callback) {
    let model = new Gtk.ListStore();
    model.set_column_types([
        GObject.TYPE_STRING,
        GObject.TYPE_STRING
    ]);

    let combobox = new Gtk.ComboBox({ model: model });
    let renderer = new Gtk.CellRendererText();

    combobox.pack_start(renderer, true);
    combobox.add_attribute(renderer, 'text', 1);

    for (let i = 0; i < options.length; i++) {
        const option = options[i];
        model.set(model.append(), [0, 1], [option, option]);
    }

    combobox.connect('changed', function () {
        let [success, iter] = combobox.get_active_iter();
        if (!success)
            return;
        let value = model.get_value(iter, 0);

        if (typeof callback !== 'undefined') {
            callback(value)
        }
    });

    grid.attach_next_to(combobox, null, Gtk.PositionType.BOTTOM, 1, 1);

    return combobox;
}

// grabbed from sysmonitor code

const IntSelect = GObject.registerClass({
        GTypeName: 'gTile.IntSelect',
    }, class IntSelect extends GObject.Object {

    _init(name) {
        this.label = new Gtk.Label({
            label: name + ":",
            halign: Gtk.Align.START
        });
        this.spin = new Gtk.SpinButton({
            halign: Gtk.Align.END
        });
        this.actor = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, spacing: 10});
        this.actor.set_homogeneous(true);
        box_append(this.actor, this.label)
        box_append(this.actor, this.spin)
        this.spin.set_numeric(true);
    }

    set_args(minv, maxv, incre, page){
        this.spin.set_range(minv, maxv);
        this.spin.set_increments(incre, page);
    }

    set_value(value){
        this.spin.set_value(value);
    }
});

const TextEntry = GObject.registerClass({
        Name: 'gTile.TextEntry',
    },  class TextEntry extends GObject.Object {
    _init(name) {
        this.label = new Gtk.Label({label: name + ":"});
        this.textentry = new Gtk.Entry();
        this.actor = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, spacing: 10});
        this.actor.set_homogeneous(true);
        box_append(this.actor, this.label);
        box_append(this.actor, this.textentry);
        this.textentry.set_text("");
    }

    set_args(width){
        this.textentry.set_width_chars(width);
    }

    set_value(value){
        this.textentry.set_text(value);
    }
});


function append_hotkey(model, settings, name, pretty_name) {
    let _ok, key, mods;

    if (Gtk.get_major_version() >= 4) {
        // ignore ok as failure treated as disabled
        [_ok, key, mods] = Gtk.accelerator_parse(settings.get_strv(name)[0]);
    } else {
        [key, mods] = Gtk.accelerator_parse(settings.get_strv(name)[0]);
    }

    let row = model.insert(-1);

    model.set(row, [0, 1, 2, 3], [name, pretty_name, mods, key ]);
}
