// Library imports
const GObject = imports.gi.GObject;
const Gdk = imports.gi.Gdk;
const Gtk = imports.gi.Gtk;
const Gio = imports.gi.Gio;
const Lang = imports.lang;

// Extension imports
const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Settings = Extension.imports.settings;

// Redefining globals from extension.js - do not know how to do it better :-(
const SETTINGS_GRID_SIZES = 'grid-sizes';
const SETTINGS_AUTO_CLOSE = 'auto-close';
const SETTINGS_ANIMATION = 'animation';
const SETTINGS_TOP_PANEL = 'top-panel';
const SETTINGS_BOTTOM_PANEL = 'bottom-panel';
const SETTINGS_GLOBAL_PRESETS = 'global-presets';
const SETTINGS_WINDOW_MARGIN = 'window-margin';
const SETTINGS_PRESET_RESIZE = 'resize';
const SETTINGS_DEBUG = 'debug';
const SETTINGS_INSETS_PRIMARY_LEFT = 'insets-primary-left';
const SETTINGS_INSETS_PRIMARY_RIGHT = 'insets-primary-right';
const SETTINGS_INSETS_PRIMARY_TOP = 'insets-primary-top';
const SETTINGS_INSETS_PRIMARY_BOTTOM = 'insets-primary-bottom';
const SETTINGS_INSETS_SECONDARY_LEFT = 'insets-secondary-left';
const SETTINGS_INSETS_SECONDARY_RIGHT = 'insets-secondary-right';
const SETTINGS_INSETS_SECONDARY_TOP = 'insets-secondary-top';
const SETTINGS_INSETS_SECONDARY_BOTTOM = 'insets-secondary-bottom';
const SETTINGS_HELP_TEXT = 'help-text';

// Globals
const pretty_names = {
	'show-toggle-tiling': 'Display gTile',
	'set-tiling'	    : 'Set tiling',
	'cancel-tiling'     : 'Cancel tiling',
    'change-grid-size'  : 'Change grid size',
	'resize-left'       : 'Resize horizontal narrower',         
	'resize-right'      : 'Resize horizontal wider',         
	'resize-up'         : 'Resize vertical higher',
	'resize-down'       : 'Resize vertical lower',
	'preset-resize-1'   : 'Preset resize 1',
	'preset-resize-2'   : 'Preset resize 2',
	'preset-resize-3'   : 'Preset resize 3',
	'preset-resize-4'   : 'Preset resize 4',
	'preset-resize-5'   : 'Preset resize 5',
	'preset-resize-6'   : 'Preset resize 6',
	'preset-resize-7'   : 'Preset resize 7',
	'preset-resize-8'   : 'Preset resize 8',
	'preset-resize-9'   : 'Preset resize 9',
	'preset-resize-10'  : 'Preset resize 10',
	'preset-resize-11'  : 'Preset resize 11',
	'preset-resize-12'  : 'Preset resize 12',
	'preset-resize-13'  : 'Preset resize 13',
	'preset-resize-14'  : 'Preset resize 14',
	'preset-resize-15'  : 'Preset resize 15',
	'preset-resize-16'  : 'Preset resize 16',
	'preset-resize-17'  : 'Preset resize 17',
	'preset-resize-18'  : 'Preset resize 18',
	'preset-resize-19'  : 'Preset resize 19',
	'preset-resize-20'  : 'Preset resize 20',
	'preset-resize-21'  : 'Preset resize 21',
	'preset-resize-22'  : 'Preset resize 22',
	'preset-resize-23'  : 'Preset resize 23',
	'preset-resize-24'  : 'Preset resize 24',
	'preset-resize-25'  : 'Preset resize 25',
	'preset-resize-26'  : 'Preset resize 26',
	'preset-resize-27'  : 'Preset resize 27',
	'preset-resize-28'  : 'Preset resize 28',
	'preset-resize-29'  : 'Preset resize 29',
	'preset-resize-30'  : 'Preset resize 30'
} 

function init() {

}

function accel_tab(notebook) {
	let settings = Settings.get();
	let ks_grid = new Gtk.Grid({ orientation: Gtk.Orientation.VERTICAL,
                                  row_spacing: 6,
                                  column_spacing: 6 });	

	let model = new Gtk.ListStore();

	model.set_column_types([
		GObject.TYPE_STRING,
		GObject.TYPE_STRING,
		GObject.TYPE_INT,
		GObject.TYPE_INT
	]);

	for (key in pretty_names) {
		append_hotkey(model, settings, key, pretty_names[key]);
	}

	let treeview = new Gtk.TreeView({
		'expand': true,
		'model': model
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

	cellrend.connect('accel-edited', function(rend, str_iter, key, mods) {
		let value = Gtk.accelerator_name(key, mods);
		

  	let [success, iter] = model.get_iter_from_string(str_iter);

		
		if (!success) {
			throw new Error("Something be broken, yo.");
		}

		let name = model.get_value(iter, 0);

		model.set(iter, [ 2, 3 ], [ mods, key ]);

		global.log("Changing value for " + name + ": " + value);

		settings.set_strv(name, [value]);
	});

	col = new Gtk.TreeViewColumn({
		'title': 'Accel'
	});

	col.pack_end(cellrend, false);
	col.add_attribute(cellrend, 'accel-mods', 2);
	col.add_attribute(cellrend, 'accel-key', 3);

	treeview.append_column(col);

	text = "Keyboard shortcuts. Arrows are used to move window and are not re-assignable.";
	ks_grid.add(new Gtk.Label({ label: text, use_markup: false, halign: Gtk.Align.START }));	
	ks_grid.add(treeview);
  
	let ks_window = new Gtk.ScrolledWindow({'vexpand': true});
        ks_window.add(ks_grid);
	let ks_label = new Gtk.Label({ label: "Accelerators", use_markup: false, halign: Gtk.Align.START })	
	notebook.append_page(ks_window, ks_label);	  
}

function basics_tab(notebook) {
	let settings = Settings.get();
  	
	let bs_grid = new Gtk.Grid({ orientation: Gtk.Orientation.VERTICAL,
                                  row_spacing: 6,
                                  column_spacing: 6 });

	let text = "For changes in this and other tabs to take effect - restart Gnome Shell <Alt>F2 r";
	
        bs_grid.add(new Gtk.Label({ label: text, use_markup: false, halign: Gtk.Align.START }));	
	
	add_check("Auto close"          , SETTINGS_AUTO_CLOSE      , bs_grid, settings);
	add_check("Animation"           , SETTINGS_ANIMATION       , bs_grid, settings);
	add_check("Top panel"           , SETTINGS_TOP_PANEL       , bs_grid, settings);
	add_check("Bottom panel present", SETTINGS_BOTTOM_PANEL    , bs_grid, settings);

	add_text ("Grid sizes (like 6x4,8x6,21x11)", SETTINGS_GRID_SIZES      , bs_grid, settings, 30);	
	add_check("Global resize presets (works without gTile activated)", SETTINGS_GLOBAL_PRESETS  , bs_grid, settings);

	add_check("Debug", SETTINGS_DEBUG    , bs_grid, settings);
	text = "To see debug messages, in terminal run gnome-shell --replace";
	bs_grid.add(new Gtk.Label({ label: text, use_markup: false, halign: Gtk.Align.START }));	
	
	let bs_window = new Gtk.ScrolledWindow({'vexpand': true});
        bs_window.add(bs_grid);
	let bs_label = new Gtk.Label({ label: "Basic", use_markup: false, halign: Gtk.Align.START })		
	notebook.append_page(bs_window, bs_label);	
}

function presets_tab(notebook) {
	let settings = Settings.get();
  	let pr_grid = new Gtk.Grid({ orientation: Gtk.Orientation.VERTICAL,
                                  row_spacing: 6,
                                  column_spacing: 6 });

	text = "Resize presets (grid size and 2 corners, 2x2 0:1 0:1 is left bottom quarter)";
	pr_grid.add(new Gtk.Label({ label: text, use_markup: false, halign: Gtk.Align.START }));	

	for (var ind = 1; ind <= 30; ind++) {
	    add_text ("Preset resize " + ind, SETTINGS_PRESET_RESIZE + ind, pr_grid, settings, 20);
	}
	let pr_window = new Gtk.ScrolledWindow({'vexpand': true});
        pr_window.add(pr_grid);	
	let pr_label = new Gtk.Label({ label: "Resize presets", use_markup: false, halign: Gtk.Align.START })	
	notebook.append_page(pr_window, pr_label);		

}

function margins_tab(notebook) {
	let settings = Settings.get();
  	let mg_grid = new Gtk.Grid({ orientation: Gtk.Orientation.VERTICAL,
                                  row_spacing: 6,
                                  column_spacing: 6 });

	let text = "Window margins and invisible borders around screen.";
	mg_grid.add(new Gtk.Label({ label: text, use_markup: false, halign: Gtk.Align.START }));	
	add_int  ("Window margin"            , SETTINGS_WINDOW_MARGIN           , mg_grid, settings, 0, 100, 1, 10);
	add_int  ("Insets primary left"      , SETTINGS_INSETS_PRIMARY_LEFT     , mg_grid, settings, 0, 100, 1, 10);
	add_int  ("Insets primary right"     , SETTINGS_INSETS_PRIMARY_RIGHT    , mg_grid, settings, 0, 100, 1, 10);
	add_int  ("Insets primary top"       , SETTINGS_INSETS_PRIMARY_TOP      , mg_grid, settings, 0, 100, 1, 10);
	add_int  ("Insets primary bottom"    , SETTINGS_INSETS_PRIMARY_BOTTOM   , mg_grid, settings, 0, 100, 1, 10);
	add_int  ("Insets secondary left"    , SETTINGS_INSETS_SECONDARY_LEFT   , mg_grid, settings, 0, 100, 1, 10);
	add_int  ("Insets secondary right"   , SETTINGS_INSETS_SECONDARY_RIGHT  , mg_grid, settings, 0, 100, 1, 10);
	add_int  ("Insets secondary top"     , SETTINGS_INSETS_SECONDARY_TOP    , mg_grid, settings, 0, 100, 1, 10);
	add_int  ("Insets secondary bottom"  , SETTINGS_INSETS_SECONDARY_BOTTOM , mg_grid, settings, 0, 100, 1, 10);

	let mg_window = new Gtk.ScrolledWindow({'vexpand': true});
        mg_window.add(mg_grid);	
	let mg_label = new Gtk.Label({ label: "Margins", use_markup: false, halign: Gtk.Align.START })	
	notebook.append_page(mg_window, mg_label);	
}

function help_tab(notebook) {
	let settings = Settings.get();
	let buffer = new Gtk.TextBuffer();
	let help_str = settings.get_string(SETTINGS_HELP_TEXT);
	if(help_str === "Unknown") {
	     help_str = "No help text, write your own in gSettings";
	}
	buffer.set_text(help_str, help_str.length);
	
        this.text_view = new Gtk.TextView ({
            buffer: buffer,
            editable: false,
            wrap_mode: Gtk.WrapMode.WORD });	
	let hl_window = new Gtk.ScrolledWindow({'vexpand': true});
        hl_window.add(text_view);	
	let hl_label = new Gtk.Label({ label: "Help", use_markup: false, halign: Gtk.Align.START });
	notebook.append_page(hl_window, hl_label);
}

function buildPrefsWidget() {

	let notebook = new Gtk.Notebook();

	basics_tab(notebook);
	accel_tab(notebook);
	presets_tab(notebook);
	margins_tab(notebook);	
	help_tab(notebook);

        let main_vbox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL,
                                       spacing: 10,
                                       border_width: 10});
	
	main_vbox.pack_start(notebook, true, true, 0);	
	
	main_vbox.show_all();

	return main_vbox;
}

function add_check(check_label, SETTINGS, grid, settings) {
	let check = new Gtk.CheckButton({ label: check_label, margin_top: 6 });
	settings.bind(SETTINGS, check, 'active', Gio.SettingsBindFlags.DEFAULT);
	grid.add(check);  
}

function add_int(int_label, SETTINGS, grid, settings, minv, maxv, incre, page) {
	let item = new IntSelect(int_label);
	item.set_args(minv, maxv, incre, page);
	settings.bind(SETTINGS, item.spin, 'value', Gio.SettingsBindFlags.DEFAULT);
	grid.add(item.actor);
}
function add_text(text_label, SETTINGS, grid, settings, width) {
	let item = new TextEntry(text_label);
	item.set_args(width);
	settings.bind(SETTINGS, item.textentry, 'text', Gio.SettingsBindFlags.DEFAULT);
	grid.add(item.actor);
}

// grabbed from sysmonitor code

const IntSelect = new Lang.Class({
        Name: 'gTile.IntSelect',

    _init: function(name) {
        this.label = new Gtk.Label({label: name + ":"});
        this.spin = new Gtk.SpinButton();
        this.actor = new Gtk.HBox();
        this.actor.add(this.label);
        this.actor.add(this.spin);
        this.spin.set_numeric(true);
    },
    set_args: function(minv, maxv, incre, page){
        this.spin.set_range(minv, maxv);
        this.spin.set_increments(incre, page);
    },
    set_value: function(value){
        this.spin.set_value(value);
    }
});

const TextEntry = new Lang.Class({
        Name: 'gTile.TextEntry',

    _init: function(name) {
        this.label = new Gtk.Label({label: name + ":"});
        this.textentry = new Gtk.Entry();
        this.actor = new Gtk.HBox();
        this.actor.add(this.label);
        this.actor.add(this.textentry);
        this.textentry.set_text("");
    },
    set_args: function(width){
        this.textentry.set_width_chars(width);
    },
    set_value: function(value){
        this.textentry.set_text(value);
    }
});


function append_hotkey(model, settings, name, pretty_name) {
	let [key, mods] = Gtk.accelerator_parse(settings.get_strv(name)[0]);

	let row = model.insert(10);

	model.set(row, [0, 1, 2, 3], [name, pretty_name, mods, key ]);
}

