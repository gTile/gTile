import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

const UUID = 'gTile@vibou';

// This harness runs inside a disposable Shell, with ordinary extension APIs.
// It deliberately does not enable Shell's unsafe D-Bus Eval interface.
export default class SmokeTest extends Extension {
  #sources = new Set();
  #windowProcess;

  enable() {
    void this.#run();
  }

  disable() {
    for (const id of this.#sources) GLib.Source.remove(id);
    this.#sources.clear();
    this.#windowProcess?.force_exit();
  }

  #delay(ms = 100) {
    return new Promise(resolve => {
      const id = GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => {
        this.#sources.delete(id);
        resolve();
        return GLib.SOURCE_REMOVE;
      });
      this.#sources.add(id);
    });
  }

  async #wait(check, label) {
    for (let i = 0; i < 100; i++) {
      if (check()) return;
      await this.#delay();
    }
    throw new Error(`Timed out: ${label}`);
  }

  async #run() {
    const checks = [];
    const assert = (condition, label) => {
      if (!condition) throw new Error(label);
      checks.push(label);
    };
    try {
      await this.#wait(() => Main.extensionManager.lookup(UUID)?.state === 1,
        'extension enabled');
      const extension = Main.extensionManager.lookup(UUID);
      const base = extension.dir.get_uri();
      const {default: Overlay} = await import(`${base}/ui/Overlay.js`);
      const {default: DesktopManager} =
        await import(`${base}/core/DesktopManager.js`);
      const {default: UserPreferences} =
        await import(`${base}/core/UserPreferences.js`);
      const settings = extension.stateObj.settings;
      const overlays = () => Main.uiGroup.get_children()
        .filter(actor => actor instanceof Overlay);

      assert(overlays().length === 2, 'one overlay for each virtual monitor');
      assert(overlays().every(o => o.orientation === Clutter.Orientation.VERTICAL),
        'GNOME 51 vertical layout');
      await this.#wait(() => !Main.layoutManager._startingUp, 'Shell startup complete');
      Main.overview.hide();
      await this.#delay(500);
      const launcher = new Gio.SubprocessLauncher({});
      // A nested compositor's children need its Wayland socket explicitly.
      launcher.setenv('WAYLAND_DISPLAY', GLib.getenv('WAYLAND_DISPLAY') ?? 'wayland-0', true);
      this.#windowProcess = launcher.spawnv(['gjs', '-m', `${this.path}/window.js`]);
      const windows = () => global.get_window_actors().map(a => a.meta_window);
      await this.#wait(() => windows().some(w => w.title === 'gTile smoke <&> window'),
        'Wayland test window');
      const window = windows().find(w => w.title === 'gTile smoke <&> window');
      window.activate(global.get_current_time());
      await this.#wait(() => global.display.focus_window === window, 'focus window');
      Main.overview.hide();
      await this.#wait(() => !Main.overview.visible, 'overview hidden');

      const icon = Main.panel.statusArea[UUID];
      await this.#wait(() => icon.width > 0 && icon.height > 0, 'panel allocation');
      const seat = global.stage.context.get_backend().get_default_seat();
      const pointer = seat.create_virtual_device(Clutter.InputDeviceType.POINTER_DEVICE);
      const keyboard = seat.create_virtual_device(Clutter.InputDeviceType.KEYBOARD_DEVICE);
      // Seat initialization can warp a newly created virtual pointer. Warm it
      // up and let the input thread settle before moving to the panel target.
      pointer.notify_absolute_motion(GLib.get_monotonic_time(), 200, 200);
      await this.#delay(300);
      const [panelX, panelY] = icon.get_transformed_position();
      pointer.notify_absolute_motion(GLib.get_monotonic_time(),
        panelX + icon.width / 2, panelY + icon.height / 2);
      await this.#wait(() => icon.hover, 'pointer over panel icon');
      pointer.notify_button(GLib.get_monotonic_time(), Clutter.BUTTON_PRIMARY,
        Clutter.ButtonState.PRESSED);
      await this.#delay();
      pointer.notify_button(GLib.get_monotonic_time(), Clutter.BUTTON_PRIMARY,
        Clutter.ButtonState.RELEASED);
      await this.#wait(() => overlays().every(o => o.visible), 'panel click');
      assert(true, 'GNOME 51 click controller opens overlays');

      // Hide the overlay first; while it is open Return is a tiling shortcut.
      icon.emit('activated');
      icon.grab_key_focus();
      await this.#delay();
      keyboard.notify_keyval(GLib.get_monotonic_time(), Clutter.KEY_Return, Clutter.KeyState.PRESSED);
      keyboard.notify_keyval(GLib.get_monotonic_time(), Clutter.KEY_Return, Clutter.KeyState.RELEASED);
      await this.#wait(() => overlays().every(o => o.visible), 'panel keyboard activation');
      assert(true, 'GNOME 51 keyboard controller opens overlays');
      icon.emit('activated');
      window.activate(global.get_current_time());
      await this.#delay();
      keyboard.notify_keyval(GLib.get_monotonic_time(), Clutter.KEY_Super_L, Clutter.KeyState.PRESSED);
      keyboard.notify_keyval(GLib.get_monotonic_time(), Clutter.KEY_Return, Clutter.KeyState.PRESSED);
      keyboard.notify_keyval(GLib.get_monotonic_time(), Clutter.KEY_Return, Clutter.KeyState.RELEASED);
      keyboard.notify_keyval(GLib.get_monotonic_time(), Clutter.KEY_Super_L, Clutter.KeyState.RELEASED);
      await this.#wait(() => overlays().every(o => o.visible), 'global keyboard shortcut');
      assert(true, 'global Super+Enter shortcut opens overlays');
      assert(overlays().every(o => o.title === window.title), 'window title stays plain text');

      const previous = overlays()[0];
      Main.layoutManager.emit('monitors-changed');
      assert(overlays().length === 2 && overlays()[0] !== previous,
        'Shell monitor-change notification recreates overlays');

      const overlay = overlays()[window.get_monitor()];
      settings.set_boolean('auto-close', false);
      settings.set_boolean('auto-maximize', false);
      overlay.gridSize = {cols: 2, rows: 2};
      overlay.gridSelection = {anchor: {col: 0, row: 0}, target: {col: 0, row: 0}};
      overlay.emit('selected');
      const area = global.workspace_manager.get_active_workspace()
        .get_work_area_for_monitor(window.get_monitor());
      await this.#wait(() => {
        const frame = window.get_frame_rect();
        return Math.abs(frame.x - area.x) <= 1 && Math.abs(frame.y - area.y) <= 1 &&
          Math.abs(frame.width - area.width / 2) <= 1 &&
          Math.abs(frame.height - area.height / 2) <= 1;
      }, 'quarter-screen tiling');
      assert(true, 'selection moves and resizes a real Wayland window');

      const desktop = new DesktopManager({
        shell: global, display: global.display,
        layoutManager: Main.layoutManager, workspaceManager: global.workspace_manager,
        userPreferences: new UserPreferences({settings}),
      });
      try {
        assert(desktop.monitors.every(m => Number.isFinite(m.scale) && m.scale > 0),
          'monitor geometry_scale is valid');
        desktop.moveToMonitor(window, 1);
        await this.#wait(() => window.get_monitor() === 1, 'move to second monitor');
        assert(true, 'window moves to the second monitor');
        settings.set_boolean('auto-maximize', true);
        desktop.applySelection(window, 1, {cols: 2, rows: 2},
          {anchor: {col: 0, row: 0}, target: {col: 1, row: 1}});
        await this.#wait(() => window.is_maximized(), 'full-grid maximization');
        assert(true, 'GNOME 51 maximization API works');
        desktop.autotile({mode: 'cols', cells: [
          {weight: 1, dynamic: false}, {weight: 1, dynamic: true},
        ]}, 1);
        const workArea = global.workspace_manager.get_active_workspace()
          .get_work_area_for_monitor(1);
        await this.#wait(() => !window.is_maximized() &&
          Math.abs(window.get_frame_rect().width - workArea.width / 2) <= 1,
        'autotiling');
        assert(true, 'autotiling unmaximizes and resizes the focused window');
      } finally {
        desktop.release();
      }

      for (let i = 0; i < 3; i++) {
        // Call the same synchronous lifecycle hooks used by Shell. Manager
        // rebasing can temporarily disable this harness itself, so it cannot
        // drive its own suspension through the manager's settings API.
        extension.stateObj.disable();
        assert(!Main.panel.statusArea[UUID] && overlays().length === 0,
          `disable cycle ${i + 1} removes panel and overlays`);
        extension.stateObj.enable();
        assert(overlays().length === 2, `enable cycle ${i + 1} recreates exactly two overlays`);
      }

      const prefs = new Gio.SubprocessLauncher({});
      prefs.setenv('WAYLAND_DISPLAY', GLib.getenv('WAYLAND_DISPLAY') ?? 'wayland-0', true);
      // Match the installed preferences launcher's private Shew library paths.
      prefs.setenv('GI_TYPELIB_PATH', '/usr/lib/gnome-shell/girepository-1.0', true);
      prefs.setenv('LD_LIBRARY_PATH', '/usr/lib/gnome-shell', true);
      const child = prefs.spawnv(['gjs', '-m', `${this.path}/preferences.js`, extension.path]);
      await new Promise((resolve, reject) => child.wait_check_async(null,
        (process, result) => {
          try { process.wait_check_finish(result); resolve(); } catch (error) { reject(error); }
        }));
      assert(true, 'preferences window builds and settings bindings work');
      GLib.file_set_contents('/tmp/gtile-smoke-results.json',
        JSON.stringify({passed: true, checks}, null, 2));
    } catch (error) {
      console.error(error);
      GLib.file_set_contents('/tmp/gtile-smoke-results.json',
        JSON.stringify({passed: false, checks, error: String(error), stack: error.stack}, null, 2));
    } finally {
      this.#windowProcess?.force_exit();
      Main.extensionManager.lookup(UUID)?.stateObj?.disable();
      global.context.terminate();
    }
  }
}
