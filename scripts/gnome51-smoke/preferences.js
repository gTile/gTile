import Adw from 'gi://Adw?version=1';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Gtk from 'gi://Gtk?version=4.0';

Gio.Resource.load('/usr/share/gnome-shell/org.gnome.Shell.Extensions.src.gresource')
  ._register();
Adw.init();
const path = ARGV[0];
const [, contents] = Gio.File.new_for_path(`${path}/metadata.json`).load_contents(null);
const metadata = JSON.parse(new TextDecoder().decode(contents));
metadata.path = path;
metadata.dir = Gio.File.new_for_path(path);
const {default: Preferences} = await import(`${GLib.filename_to_uri(path, null)}/prefs.js`);
const preferences = new Preferences(metadata);
const settings = preferences.getSettings();
// Check that custom shortcuts are rendered as text, including entity syntax.
settings.set_strv('show-toggle-tiling', ['<&lt;&amp;>']);
const app = new Gtk.Application({application_id: 'org.gtile.SmokePreferences'});
let failure;
app.connect('activate', () => {
  void (async () => {
    const window = new Adw.PreferencesWindow({application: app});
    try {
      await preferences.fillPreferencesWindow(window);
      if (window.get_visible_page().title !== 'General')
        throw new Error('General preferences page missing');
      const labels = [];
      const walk = widget => {
        if (widget instanceof Gtk.Label) labels.push(widget);
        for (let child = widget.get_first_child(); child; child = child.get_next_sibling())
          walk(child);
      };
      walk(window);
      if (!labels.some(label => label.get_text() === '<&lt;&amp;>'))
        throw new Error('Shortcut markup was not escaped completely');
      settings.set_strv('show-toggle-tiling', ['<Super>Return']);
      window.present();
      GLib.timeout_add(GLib.PRIORITY_DEFAULT, 250, () => {
        window.close();
        app.quit();
        return GLib.SOURCE_REMOVE;
      });
    } catch (error) {
      failure = error;
      window.close();
      app.quit();
    }
  })();
});
await app.runAsync([]);
if (failure) throw failure;
