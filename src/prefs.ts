// @ts-nocheck
import Adw from "gi://Adw?version=1";
import GObject from "gi://GObject";
import Gio from "gi://Gio?version=2.0";
import Gtk from "gi://Gtk?version=4.0";

import { ExtensionPreferences } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

import { ExtensionSettings, KeyBindingSettingKey } from "./types/settings.js";

function append_hotkey(model, settings, name, pretty_name) {
    let _ok, key, mods;

    [_ok, key, mods] = Gtk.accelerator_parse(settings.get_strv(name)[0]);

    let row = model.insert(-1);

    model.set(row, [0, 1, 2, 3], [name, pretty_name, mods, key ]);
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
        model,
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
        // @ts-ignore
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


// Adwaita icons
// https://iconduck.com/sets/adwaita-icon-theme
// https://gitlab.gnome.org/hestreet/adwaita-icon-theme/-/tree/master/Adwaita/scalable
export default class extends ExtensionPreferences {
  #settings!: ExtensionSettings;

  fillPreferencesWindow(window: Adw.PreferencesWindow): void {
    // window._settings = this.#settings = this.getSettings();
    this.#settings = this.getSettings();

    // window.set_default_size(0, 740);
    // window.set_default_size(820, 600);
    window.set_search_enabled(true);

    window.add(this.#buildGeneralPage());
    window.add(this.#buildThemePage());
    window.add(this.#buildAccelPage());
  }

  #buildGeneralPage() {
    const page = new Adw.PreferencesPage({
      title: "General",
      icon_name: "system-lock-screen-symbolic",
    });

    const group = new Adw.PreferencesGroup({ title: 'Group Title' });
    page.add(group);

    // TODO: addToggle() or similar
    const sr = new Adw.SwitchRow({ title: "Auto close on resize" });
    this.#settings.bind("auto-close", sr, "active", Gio.SettingsBindFlags.DEFAULT);
    group.add(sr);

    const sr2 = new Adw.SwitchRow({ title: "Auto close on keyboard shortcut" });
    this.#settings.bind("auto-close-keyboard-shortcut", sr2, "active", Gio.SettingsBindFlags.DEFAULT);
    group.add(sr2);

    // const sr3 = new Adw.SwitchRow({ title: "Animation" });
    // this.#settings.bind("animation", sr3, "active", Gio.SettingsBindFlags.DEFAULT);
    // group.add(sr3);

    const sr4 = new Adw.SwitchRow({ title: "Show icon" });
    this.#settings.bind("show-icon", sr4, "active", Gio.SettingsBindFlags.DEFAULT);
    group.add(sr4);

    const er = new Adw.EntryRow({ title: "Grid sizes (like 6x4,8x6,21x11)", editable: true });
    this.#settings.bind("grid-sizes", er, "text", Gio.SettingsBindFlags.DEFAULT);
    group.add(er);

    // TODO: Remove this setting? Extension should have no effect when deactivated!
    // TODO: Display subtitle only when activated!
    const sr5 = new Adw.SwitchRow({
      title: "Global auto tiling hotkeys (works without gTile activated)",
      subtitle: "Warning: Make sure to change the auto tiling hotkeys when " +
        "activating this setting as the default hotkeys use 0-9 and M. " +
        "This option will bind these hotkeys globally, making them unusable " +
        "for other functions!",
      css_classes: ["red-subtitle"],
    });
    this.#settings.bind("global-auto-tiling", sr5, "active", Gio.SettingsBindFlags.DEFAULT);
    group.add(sr5);

    const sr6 = new Adw.SwitchRow({ title: "Global resize presets (works without gTile activated)" });
    this.#settings.bind("global-presets", sr6, "active", Gio.SettingsBindFlags.DEFAULT);
    group.add(sr6);

    const sr7 = new Adw.SwitchRow({ title: "Keyboard presets target monitor of mouse" });
    this.#settings.bind("target-presets-to-monitor-of-mouse", sr7, "active", Gio.SettingsBindFlags.DEFAULT);
    group.add(sr7);

    const sr8 = new Adw.SwitchRow({ title: "Enable accelerators for moving and resizing windows" });
    this.#settings.bind("moveresize-enabled", sr8, "active", Gio.SettingsBindFlags.DEFAULT);
    group.add(sr8);

    const sr9 = new Adw.SwitchRow({ title: "Show grid lines when changing grid size" });
    this.#settings.bind("show-grid-lines", sr9, "active", Gio.SettingsBindFlags.DEFAULT);
    group.add(sr9);

    const spr = new Adw.SpinRow({
      title: "Maximum timeout for preset cycling (ms)",
      // digits: 0,
      // editable: true,
      // numeric: true,
    });
    const adju = spr.adjustment;
    adju.lower = 500;
    adju.upper = 10000;
    adju.step_increment = 100;
    adju.page_increment = 1000;
    this.#settings.bind("max-timeout", adju, "value", Gio.SettingsBindFlags.DEFAULT);
    group.add(spr);

    const er2 = new Adw.EntryRow({
      title: "Autotile Main window sizes\n(Ratio of the screen to take up. Can be a decimal or a ratio)",
    });
    this.#settings.bind("main-window-sizes", er2, "text", Gio.SettingsBindFlags.DEFAULT);
    group.add(er2);

    const sr10 = new Adw.SwitchRow({
      title: "Debug",
      subtitle: "To see debug messages, in terminal run journalctl /usr/bin/gnome-shell -f",
    });
    this.#settings.bind("debug", sr10, "active", Gio.SettingsBindFlags.DEFAULT);
    group.add(sr10);

    return page;
  }

  #buildThemePage() {
    const page = new Adw.PreferencesPage({
      title: "Appearance",
      icon_name: "system-lock-screen-symbolic",
    });

    const group = new Adw.PreferencesGroup({ title: 'Theme' });
    page.add(group);

    const entries = Gtk.StringList.new([
      "Default",
      "Classic",
      "Minimal Dark",
      "Minimal Light",
    ]);
    const cr = new Adw.ComboRow({
      title: "Theme",
      model: entries,
    });
    group.add(cr);

    for (let i = 0; i < entries.get_n_items(); ++i) {
      const ut = this.#settings.get_string("theme");
      if (entries.get_string(i) === ut) {
        cr.selected = i;
        break;
      }
    }
    cr.connect("notify::selected", () => {
      this.#settings.set_string("theme", entries.get_string(cr.selected));
    });
    // TODO: How/When to disconnect?
    // this.#settings.connect("changed::theme", () => {
    //   const newTheme = this.#settings.get_string("theme");

    //   for (let i = 0; i < entries.get_n_items(); ++i) {
    //     if (newTheme === entries.get_string(i)) {
    //       cr.selected = i;
    //     }
    //   }
    // });

    return page;
  }

  #buildAccelPage() {
    const page = new Adw.PreferencesPage({
      title: "Accel",
      icon_name: "system-lock-screen-symbolic",
    });

    const group = new Adw.PreferencesGroup({ title: 'Accel' });
    page.add(group);

    const desc = this.#settings.settings_schema.get_key("autotile-6").get_summary();
    const sr = new Adw.SwitchRow({ title: desc });
    group.add(sr);

    return page;
  }

  #buildAboutPage() {

  }
}

function  buildPrefsWidget() {
  // accel_tab(notebook, settings);
  // presets_tab(notebook, settings);
  // margins_tab(notebook, settings);
  // help_tab(notebook);
}

// Redefining globals from extension.js - do not know how to do it better :-(
const SETTINGS_WINDOW_MARGIN = 'window-margin';
const SETTINGS_PRESET_RESIZE = 'resize';

const SETTINGS_INSETS_PRIMARY_LEFT = 'insets-primary-left';
const SETTINGS_INSETS_PRIMARY_RIGHT = 'insets-primary-right';
const SETTINGS_INSETS_PRIMARY_TOP = 'insets-primary-top';
const SETTINGS_INSETS_PRIMARY_BOTTOM = 'insets-primary-bottom';

const SETTINGS_INSETS_SECONDARY_LEFT = 'insets-secondary-left';
const SETTINGS_INSETS_SECONDARY_RIGHT = 'insets-secondary-right';
const SETTINGS_INSETS_SECONDARY_TOP = 'insets-secondary-top';
const SETTINGS_INSETS_SECONDARY_BOTTOM = 'insets-secondary-bottom';

const sss: KeyBindingSettingKey[] = [
  'show-toggle-tiling',
  'show-toggle-tiling-alt',
  'set-tiling',
  'cancel-tiling',
  'change-grid-size',
  'autotile-main',
  'autotile-main-inverted',
  'autotile-1',
  'autotile-2',
  'autotile-3',
  'autotile-4',
  'autotile-5',
  'autotile-6',
  'autotile-7',
  'autotile-8',
  'autotile-9',
  'autotile-10',
  'snap-to-neighbors',
  'preset-resize-1',
  'preset-resize-2',
  'preset-resize-3',
  'preset-resize-4',
  'preset-resize-5',
  'preset-resize-6',
  'preset-resize-7',
  'preset-resize-8',
  'preset-resize-9',
  'preset-resize-10',
  'preset-resize-11',
  'preset-resize-12',
  'preset-resize-13',
  'preset-resize-14',
  'preset-resize-15',
  'preset-resize-16',
  'preset-resize-17',
  'preset-resize-18',
  'preset-resize-19',
  'preset-resize-20',
  'preset-resize-21',
  'preset-resize-22',
  'preset-resize-23',
  'preset-resize-24',
  'preset-resize-25',
  'preset-resize-26',
  'preset-resize-27',
  'preset-resize-28',
  'preset-resize-29',
  'preset-resize-30',
  'action-change-tiling',
  'action-contract-bottom',
  'action-contract-left',
  'action-contract-right',
  'action-contract-top',
  'action-expand-bottom',
  'action-expand-left',
  'action-expand-right',
  'action-expand-top',
  'action-move-down',
  'action-move-left',
  'action-move-right',
  'action-move-up',
  'action-move-next-monitor',
  'move-left-vi',
  'move-right-vi',
  'move-up-vi',
  'move-down-vi',
  'resize-left-vi',
  'resize-right-vi',
  'resize-up-vi',
  'resize-down-vi',
  'action-autotile-main',
  'action-autotile-main-inverted',
];


// Globals
const pretty_names = {
    'show-toggle-tiling'           : 'Display gTile',
    'show-toggle-tiling-alt'       : 'Display gTile alternative',
    'set-tiling'                   : 'Set tiling',
    'cancel-tiling'                : 'Cancel tiling',
    'change-grid-size'             : 'Change grid size',
    'autotile-main'                : 'Autotile Main to left',
    'autotile-main-inverted'       : 'Autotile Main to right',
    'autotile-1'                   : 'Autotile 1 cols',
    'autotile-2'                   : 'Autotile 2 cols',
    'autotile-3'                   : 'Autotile 3 cols',
    'autotile-4'                   : 'Autotile 4 cols',
    'autotile-5'                   : 'Autotile 5 cols',
    'autotile-6'                   : 'Autotile 6 cols',
    'autotile-7'                   : 'Autotile 7 cols',
    'autotile-8'                   : 'Autotile 8 cols',
    'autotile-9'                   : 'Autotile 9 cols',
    'autotile-10'                  : 'Autotile 10 cols',
    'snap-to-neighbors'            : 'Snap window size to neighbors',
    'preset-resize-1'              : 'Preset resize 1',
    'preset-resize-2'              : 'Preset resize 2',
    'preset-resize-3'              : 'Preset resize 3',
    'preset-resize-4'              : 'Preset resize 4',
    'preset-resize-5'              : 'Preset resize 5',
    'preset-resize-6'              : 'Preset resize 6',
    'preset-resize-7'              : 'Preset resize 7',
    'preset-resize-8'              : 'Preset resize 8',
    'preset-resize-9'              : 'Preset resize 9',
    'preset-resize-10'             : 'Preset resize 10',
    'preset-resize-11'             : 'Preset resize 11',
    'preset-resize-12'             : 'Preset resize 12',
    'preset-resize-13'             : 'Preset resize 13',
    'preset-resize-14'             : 'Preset resize 14',
    'preset-resize-15'             : 'Preset resize 15',
    'preset-resize-16'             : 'Preset resize 16',
    'preset-resize-17'             : 'Preset resize 17',
    'preset-resize-18'             : 'Preset resize 18',
    'preset-resize-19'             : 'Preset resize 19',
    'preset-resize-20'             : 'Preset resize 20',
    'preset-resize-21'             : 'Preset resize 21',
    'preset-resize-22'             : 'Preset resize 22',
    'preset-resize-23'             : 'Preset resize 23',
    'preset-resize-24'             : 'Preset resize 24',
    'preset-resize-25'             : 'Preset resize 25',
    'preset-resize-26'             : 'Preset resize 26',
    'preset-resize-27'             : 'Preset resize 27',
    'preset-resize-28'             : 'Preset resize 28',
    'preset-resize-29'             : 'Preset resize 29',
    'preset-resize-30'             : 'Preset resize 30',
    'action-change-tiling'         : 'Global change grid size',
    'action-contract-bottom'       : 'Global contract bottom edge',
    'action-contract-left'         : 'Global contract left edge',
    'action-contract-right'        : 'Global contract right edge',
    'action-contract-top'          : 'Global contract top edge',
    'action-expand-bottom'         : 'Global expand bottom edge',
    'action-expand-left'           : 'Global expand left edge',
    'action-expand-right'          : 'Global expand right edge',
    'action-expand-top'            : 'Global expand top edge',
    'action-move-down'             : 'Global move window down',
    'action-move-left'             : 'Global move window left',
    'action-move-right'            : 'Global move window right',
    'action-move-up'               : 'Global move window up',
    'action-move-next-monitor'     : 'Global move window to next monitor',
    'move-left-vi'                 : 'Vi-style move left',
    'move-right-vi'                : 'Vi-style move right',
    'move-up-vi'                   : 'Vi-style move up',
    'move-down-vi'                 : 'Vi-style move down',
    'resize-left-vi'               : 'Vi-style resize narrower',
    'resize-right-vi'              : 'Vi-style resize wider',
    'resize-up-vi'                 : 'Vi-style resize taller',
    'resize-down-vi'               : 'Vi-style resize shorter',
    'action-autotile-main'         : 'Global Autotile Main to left',
    'action-autotile-main-inverted': 'Global Autotile Main to right'
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

function add_check(check_label, SETTINGS, grid, settings) {
    let check = new Gtk.CheckButton({ label: check_label, margin_top: 6 });
    settings.bind(SETTINGS, check, 'active', Gio.SettingsBindFlags.DEFAULT);
    grid.attach_next_to(check, null, Gtk.PositionType.BOTTOM, 1, 1);
}

function add_int(int_label, SETTINGS, grid, settings, minv, maxv, incre, page) {
    let item = new IntSelect(int_label);
    item.set_args(minv, maxv, incre, page);
    // @ts-ignore
    settings.bind(SETTINGS, item.spin, 'value', Gio.SettingsBindFlags.DEFAULT);
    // @ts-ignore
    grid.attach_next_to(item.actor, null, Gtk.PositionType.BOTTOM, 1, 1);
}

function add_text(text_label, SETTINGS, grid, settings, width) {
    let item = new TextEntry(text_label);
    item.set_args(width);
    // @ts-ignore
    settings.bind(SETTINGS, item.textentry, 'text', Gio.SettingsBindFlags.DEFAULT);
    // @ts-ignore
    grid.attach_next_to(item.actor, null, Gtk.PositionType.BOTTOM, 1, 1);
}

// grabbed from sysmonitor code

const IntSelect = GObject.registerClass({
        GTypeName: 'GTileIntSelect',
    }, class IntSelect extends GObject.Object {

    _init(name) {
        // @ts-ignore
        this.label = new Gtk.Label({
            label: name + ":",
            halign: Gtk.Align.START
        });
        // @ts-ignore
        this.spin = new Gtk.SpinButton({
            halign: Gtk.Align.END
        });
        // @ts-ignore
        this.actor = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, spacing: 10});
        // @ts-ignore
        this.actor.set_homogeneous(true);
        // @ts-ignore
        box_append(this.actor, this.label)
        // @ts-ignore
        box_append(this.actor, this.spin)
        // @ts-ignore
        this.spin.set_numeric(true);
    }

    set_args(minv, maxv, incre, page){
        // @ts-ignore
        this.spin.set_range(minv, maxv);
        // @ts-ignore
        this.spin.set_increments(incre, page);
    }

    set_value(value){
        // @ts-ignore
        this.spin.set_value(value);
    }
});

const TextEntry = GObject.registerClass({
        // @ts-ignore
        Name: 'gTile.TextEntry',
    },  class TextEntry extends GObject.Object {
    _init(name) {
        // @ts-ignore
        this.label = new Gtk.Label({label: name + ":"});
        // @ts-ignore
        this.textentry = new Gtk.Entry();
        // @ts-ignore
        this.actor = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, spacing: 10});
        // @ts-ignore
        this.actor.set_homogeneous(true);
        // @ts-ignore
        box_append(this.actor, this.label);
        // @ts-ignore
        box_append(this.actor, this.textentry);
        // @ts-ignore
        this.textentry.set_text("");
    }

    set_args(width){
        // @ts-ignore
        this.textentry.set_width_chars(width);
    }

    set_value(value){
        // @ts-ignore
        this.textentry.set_text(value);
    }
});
