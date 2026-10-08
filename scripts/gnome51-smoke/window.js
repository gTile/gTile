import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk?version=4.0';

const app = new Gtk.Application({ application_id: 'org.gtile.SmokeWindow' });
app.connect('activate', () => {
  const window = new Gtk.ApplicationWindow({
    application: app, title: 'gTile smoke <&> window',
    default_width: 640, default_height: 480,
  });
  window.present();
});
await app.runAsync([]);
