// Library imports
const GObject = imports.gi.GObject;
const Gdk = imports.gi.Gdk;
const Gtk = imports.gi.Gtk;

// Extension imports
const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Settings = Extension.imports.settings;

// Globals
const pretty_names = {
	'show-toggle-tiling': 'Display gTile'
}

function init() {

}

function buildPrefsWidget() {
	let model = new Gtk.ListStore();

	model.set_column_types([
		GObject.TYPE_STRING,
		GObject.TYPE_STRING,
		GObject.TYPE_INT,
		GObject.TYPE_INT
	]);

	global.log("Modal created.");

	let settings = Settings.get();

	for (key in pretty_names) {
		append_hotkey(model, settings, key, pretty_names[key]);
	}

	global.log("Added hotkeys to model");

	let treeview = new Gtk.TreeView({
		'expand': true,
		'model': model
	});

	global.log("TreeView created.");

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

	global.log("Column one created.");

	cellrend = new Gtk.CellRendererAccel({
		'editable': true,
		'accel-mode': Gtk.CellRendererAccelMode.GTK
	});

	cellrend.connect('accel-edited', function(rend, iter, key, mods) {
		let value = Gtk.accelerator_name(key, mods);
		
		let [success, iter] = model.get_iter_from_string(iter);
		
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
	
	global.log("Column two created.");

	let win = new Gtk.ScrolledWindow({
		'vexpand': true
	});
	win.add(treeview);

	global.log("ScrolledWindow created.");
	
	win.show_all();

	global.log("Returning.");

	return win;
}

function append_hotkey(model, settings, name, pretty_name) {
	let [key, mods] = Gtk.accelerator_parse(settings.get_strv(name)[0]);

	let row = model.insert(10);

	model.set(row, [0, 1, 2, 3], [name, pretty_name, mods, key ]);
}
