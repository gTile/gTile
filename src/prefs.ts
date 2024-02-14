import Adw from "gi://Adw";
import Gdk from "gi://Gdk";
import GObject from "gi://GObject";
import Gio from "gi://Gio";
import Gtk from "gi://Gtk";
import Pango from "gi://Pango";

import {
  ExtensionPreferences
} from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

import {
  BoolSettingKey,
  ExtensionSettings,
  KeyBindingSettingKey,
  NumberSettingKey,
  SettingKey,
  StringSettingKey,
} from "./types/settings.js";
import { GarbageCollection, GarbageCollector } from "./util/gc.js";

export default class extends ExtensionPreferences {
  #gc!: GarbageCollection;
  #settings!: ExtensionSettings;
  #window!: Adw.PreferencesWindow;

  fillPreferencesWindow(window: Adw.PreferencesWindow): void {
    this.#gc = new GarbageCollection();
    this.#settings = this.getSettings();
    this.#window = window;

    window.set_default_size(950, 740);
    window.set_search_enabled(true);

    window.add(this.#buildGeneralPage());
    window.add(this.#buildOverlayShortcutsPage());
    window.add(this.#buildPresetPage());
    window.add(this.#buildActionShortcutsPage());
    window.add(this.#buildAutotilingPage());

    // Listening to the `destroy` signal does not work. The only viable signals
    // to perform destructive operations are `close-request` and `unrealize`.
    window.connect("close-request", this.#release.bind(this));
  }

  #release() {
    this.#gc.release();
    this.#gc = undefined!;
    this.#settings = undefined!;
    // do NOT set #window to undefined! This would cause the GC to dereference
    // and cleanup resources before GJS expects them to be gone (even long after
    // the preference window was closed). Would cause errors like these:
    // - instance with invalid (NULL) class pointer
    // - g_signal_handlers_disconnect_matched: assertion 'G_TYPE_CHECK_INSTANCE (instance)' failed
  }

  #buildGeneralPage() {
    const page = new Adw.PreferencesPage({
      title: "General",
      icon_name: "preferences-other-symbolic",
    });

    {
      const group = new Adw.PreferencesGroup({
        title: "Global Options",
        description: "Unless stated otherwise, most settings become " +
          "effective after toggling the gTile UI. This is also the case for " +
          "all other sections and tabs.",
      });
      page.add(group);

      group.add(this.#shortcutRow("show-toggle-tiling"));
      group.add(this.#entryRow("grid-sizes"));
      group.add(this.#switchRow("auto-close"));
      group.add(this.#switchRow("show-icon"));
      group.add(this.#switchRow("show-grid-lines"));
      group.add(this.#spinRow("max-timeout", 500, 10000, 100));
      group.add(this.#spinRow("selection-timeout", 0, 5000, 50));
      group.add(this.#themeComboRow());
    }

    {
      const group = new Adw.PreferencesGroup({
        title: "Inset &amp; Spacing",
        description:
          "Note: The window spacing is additive, i.e., two adjacent windows " +
          "will have twice the spacing that is configured below."
      });
      page.add(group);

      group.add(this.#spinRow("window-spacing", 0, 50, 1));
      group.add(this.#spinRow("insets-primary-left", 0, 500, 1));
      group.add(this.#spinRow("insets-primary-right", 0, 500, 1));
      group.add(this.#spinRow("insets-primary-top", 0, 500, 1));
      group.add(this.#spinRow("insets-primary-bottom", 0, 500, 1));
      group.add(this.#spinRow("insets-secondary-left", 0, 500, 1));
      group.add(this.#spinRow("insets-secondary-right", 0, 500, 1));
      group.add(this.#spinRow("insets-secondary-top", 0, 500, 1));
      group.add(this.#spinRow("insets-secondary-bottom", 0, 500, 1));
    }

   return page;
  }

  #buildOverlayShortcutsPage() {
    const page = new Adw.PreferencesPage({
      title: "Overlay Shortcuts",
      icon_name: "preferences-desktop-keyboard-shortcuts-symbolic",
    });

    {
      const group = new Adw.PreferencesGroup({
        title: "Overlay Shortcuts",
        description:
          "These shortcuts are only active when the gTile overlay is visible."
      });
      page.add(group);

      group.add(this.#shortcutRow("set-tiling"));
      group.add(this.#shortcutRow("cancel-tiling"));
      group.add(this.#shortcutRow("change-grid-size"));
      group.add(this.#shortcutRow("snap-to-neighbors"));
      group.add(this.#shortcutRow("move-next-monitor"));
      group.add(this.#shortcutRow("move-left"));
      group.add(this.#shortcutRow("move-right"));
      group.add(this.#shortcutRow("move-up"));
      group.add(this.#shortcutRow("move-down"));
      group.add(this.#shortcutRow("resize-left"));
      group.add(this.#shortcutRow("resize-right"));
      group.add(this.#shortcutRow("resize-up"));
      group.add(this.#shortcutRow("resize-down"));
    }

    return page;
  }

  #buildPresetPage() {
    const page = new Adw.PreferencesPage({
      title: "Resize Presets",
      icon_name: "preferences-desktop-apps-symbolic",
    });

    {
      const group = new Adw.PreferencesGroup({ title: "General" });
      page.add(group);

      group.add(this.#switchRow("global-presets"));
      group.add(this.#switchRow("target-presets-to-monitor-of-mouse"));
    }

    {
      const group = new Adw.PreferencesGroup({ title: "Shortcuts" });
      page.add(group);

      group.add(this.#shortcutRow("preset-resize-1"));
      group.add(this.#shortcutRow("preset-resize-2"));
      group.add(this.#shortcutRow("preset-resize-3"));
      group.add(this.#shortcutRow("preset-resize-4"));
      group.add(this.#shortcutRow("preset-resize-5"));
      group.add(this.#shortcutRow("preset-resize-6"));
      group.add(this.#shortcutRow("preset-resize-7"));
      group.add(this.#shortcutRow("preset-resize-8"));
      group.add(this.#shortcutRow("preset-resize-9"));
      group.add(this.#shortcutRow("preset-resize-10"));
      group.add(this.#shortcutRow("preset-resize-11"));
      group.add(this.#shortcutRow("preset-resize-12"));
      group.add(this.#shortcutRow("preset-resize-13"));
      group.add(this.#shortcutRow("preset-resize-14"));
      group.add(this.#shortcutRow("preset-resize-15"));
      group.add(this.#shortcutRow("preset-resize-16"));
      group.add(this.#shortcutRow("preset-resize-17"));
      group.add(this.#shortcutRow("preset-resize-18"));
      group.add(this.#shortcutRow("preset-resize-19"));
      group.add(this.#shortcutRow("preset-resize-20"));
      group.add(this.#shortcutRow("preset-resize-21"));
      group.add(this.#shortcutRow("preset-resize-22"));
      group.add(this.#shortcutRow("preset-resize-23"));
      group.add(this.#shortcutRow("preset-resize-24"));
      group.add(this.#shortcutRow("preset-resize-25"));
      group.add(this.#shortcutRow("preset-resize-26"));
      group.add(this.#shortcutRow("preset-resize-27"));
      group.add(this.#shortcutRow("preset-resize-28"));
      group.add(this.#shortcutRow("preset-resize-29"));
      group.add(this.#shortcutRow("preset-resize-30"));
    }

    {
      const url =
        "https://github.com/gTile/gTile/blob/master/README.md#resize-presets";
      const group = new Adw.PreferencesGroup({
        title: "Presets",
        description:
          `Checkout the <a href="${url}">README</a> to learn more about ` +
          "resize presets.",
      });
      page.add(group);

      group.add(this.#entryRow("resize1"));
      group.add(this.#entryRow("resize2"));
      group.add(this.#entryRow("resize3"));
      group.add(this.#entryRow("resize4"));
      group.add(this.#entryRow("resize5"));
      group.add(this.#entryRow("resize6"));
      group.add(this.#entryRow("resize7"));
      group.add(this.#entryRow("resize8"));
      group.add(this.#entryRow("resize9"));
      group.add(this.#entryRow("resize10"));
      group.add(this.#entryRow("resize11"));
      group.add(this.#entryRow("resize12"));
      group.add(this.#entryRow("resize13"));
      group.add(this.#entryRow("resize14"));
      group.add(this.#entryRow("resize15"));
      group.add(this.#entryRow("resize16"));
      group.add(this.#entryRow("resize17"));
      group.add(this.#entryRow("resize18"));
      group.add(this.#entryRow("resize19"));
      group.add(this.#entryRow("resize20"));
      group.add(this.#entryRow("resize21"));
      group.add(this.#entryRow("resize22"));
      group.add(this.#entryRow("resize23"));
      group.add(this.#entryRow("resize24"));
      group.add(this.#entryRow("resize25"));
      group.add(this.#entryRow("resize26"));
      group.add(this.#entryRow("resize27"));
      group.add(this.#entryRow("resize28"));
      group.add(this.#entryRow("resize29"));
      group.add(this.#entryRow("resize30"));
    }

    return page;
  }

  #buildActionShortcutsPage() {
    const page = new Adw.PreferencesPage({
      title: "Action Shortcuts",
      icon_name: "accessories-character-map-symbolic",
    });

    {
      const group = new Adw.PreferencesGroup({ title: "General" });
      page.add(group);

      const subtitle = "The shortcuts below can only be enabled/disabled " +
        "globally, i.e., independent of the gTile UI visibility state.";
      group.add(this.#switchRow("moveresize-enabled", { subtitle }));
    }

    {
      const group = new Adw.PreferencesGroup({ title: "Shortcuts" });
      page.add(group);

      group.add(this.#shortcutRow("action-contract-left"));
      group.add(this.#shortcutRow("action-contract-right"));
      group.add(this.#shortcutRow("action-contract-top"));
      group.add(this.#shortcutRow("action-contract-bottom"));
      group.add(this.#shortcutRow("action-expand-left"));
      group.add(this.#shortcutRow("action-expand-right"));
      group.add(this.#shortcutRow("action-expand-top"));
      group.add(this.#shortcutRow("action-expand-bottom"));
      group.add(this.#shortcutRow("action-move-left"));
      group.add(this.#shortcutRow("action-move-right"));
      group.add(this.#shortcutRow("action-move-up"));
      group.add(this.#shortcutRow("action-move-down"));
      group.add(this.#shortcutRow("action-change-tiling"));
      group.add(this.#shortcutRow("action-move-next-monitor"));
      group.add(this.#shortcutRow("action-autotile-main"));
      group.add(this.#shortcutRow("action-autotile-main-inverted"));
    }

    return page;
  }

  #buildAutotilingPage() {
    const page = new Adw.PreferencesPage({
      title: "Autotiling",
      icon_name: "view-grid-symbolic",
    });


    {
      const group = new Adw.PreferencesGroup({ title: "General" });
      page.add(group);

      const subtitle =
        "Warning: Make sure to change the autotiling shortcuts when " +
        "activating this setting as the default shortcuts use 0-9 and M. " +
        "This option will bind these shortcuts globally, making them " +
        "unusable for other functions!";
      group.add(this.#switchRow("global-auto-tiling", { subtitle }));
    }

    {
      const group = new Adw.PreferencesGroup({ title: "Shortcuts" });
      page.add(group);

      group.add(this.#shortcutRow("autotile-main"));
      group.add(this.#shortcutRow("autotile-main-inverted"));
      group.add(this.#shortcutRow("autotile-1"));
      group.add(this.#shortcutRow("autotile-2"));
      group.add(this.#shortcutRow("autotile-3"));
      group.add(this.#shortcutRow("autotile-4"));
      group.add(this.#shortcutRow("autotile-5"));
      group.add(this.#shortcutRow("autotile-6"));
      group.add(this.#shortcutRow("autotile-7"));
      group.add(this.#shortcutRow("autotile-8"));
      group.add(this.#shortcutRow("autotile-9"));
      group.add(this.#shortcutRow("autotile-10"));
    }

    {
      const url =
        "https://github.com/gTile/gTile/blob/master/README.md#autotiling";
      const group = new Adw.PreferencesGroup({
        title: "Layouts",
        description:
          `Checkout the <a href="${url}">README</a> file to learn more about ` +
          "autotiling &amp; layouts."
      });
      page.add(group);

      group.add(this.#entryRow("autotile-gridspec-1"));
      group.add(this.#entryRow("autotile-gridspec-2"));
      group.add(this.#entryRow("autotile-gridspec-3"));
      group.add(this.#entryRow("autotile-gridspec-4"));
      group.add(this.#entryRow("autotile-gridspec-5"));
      group.add(this.#entryRow("autotile-gridspec-6"));
      group.add(this.#entryRow("autotile-gridspec-7"));
      group.add(this.#entryRow("autotile-gridspec-8"));
      group.add(this.#entryRow("autotile-gridspec-9"));
      group.add(this.#entryRow("autotile-gridspec-10"));
    }

    return page;
  }

  #switchRow(
    schemaKey: BoolSettingKey,
    params: Adw.SwitchRow.ConstructorProperties = {},
  ) {
    const row = new Adw.SwitchRow({
      ...params,
      title: this.#settings.settings_schema.get_key(schemaKey).get_summary(),
    });

    this.#settings.bind(schemaKey, row, "active", Gio.SettingsBindFlags.DEFAULT);
    return row;
  }

  #spinRow(
    schemaKey: NumberSettingKey,
    lower: number,
    upper: number,
    step: number,
  ) {
    const row = new Adw.SpinRow({
      title: this.#settings.settings_schema.get_key(schemaKey).get_summary(),
    });
    row.adjustment.lower = lower;
    row.adjustment.upper = upper;
    row.adjustment.step_increment = step;
    row.adjustment.page_increment = step * 10;
    this.#settings.bind(schemaKey, row, "value", Gio.SettingsBindFlags.DEFAULT);

    return row;
  }

  #entryRow(schemaKey: StringSettingKey) {
    const row = new Adw.EntryRow({
      title: this.#settings.settings_schema.get_key(schemaKey).get_summary(),
      editable: true,
      show_apply_button: true,
    });
    this.#settings.bind(schemaKey, row, "text", Gio.SettingsBindFlags.DEFAULT);

    return row;
  }

  #shortcutRow(schemaKey: KeyBindingSettingKey) {
    const row = new ShortcutRow({
        settings: this.#settings,
        schemaKey,
        window: this.#window,
    });
    this.#gc.defer(() => row.release());

    return row;
  }

  #themeComboRow() {
    const entries = Gtk.StringList.new(
      this.#settings.get_default_value("themes")!.get_strv());
    const row = new Adw.ComboRow({
      title: "Theme",
      subtitle: "The extension requires a restart in order for the new theme " +
        "to take effect.",
      model: entries,
    });

    for (let i = 0; i < entries.get_n_items(); ++i) {
      const ut = this.#settings.get_string("theme");
      if (entries.get_string(i) === ut) {
        row.selected = i;
        break;
      }
    }

    row.connect("notify::selected", () => {
      this.#settings.set_string("theme", entries.get_string(row.selected));
    });

    const chid = this.#settings.connect("changed::theme", () => {
      const newTheme = this.#settings.get_string("theme");

      for (let i = 0; i < entries.get_n_items(); ++i) {
        if (newTheme === entries.get_string(i)) {
          row.selected = i;
          break;
        }
      }
    });
    this.#gc.defer(() => this.#settings.disconnect(chid));

    return row;
  }
}

interface KeyPressEvent {
  keyval: number;
  modifier: Gdk.ModifierType;
}

interface ShortcutParams extends Adw.ActionRow.ConstructorProperties {
  settings: ExtensionSettings;
  schemaKey: SettingKey;
  window: Gtk.Window;
}

const ShortcutRow = GObject.registerClass({
  GTypeName: "GTileShortcutActionRow",
}, class extends Adw.ActionRow implements GarbageCollector {
  static helpText =
    "Note: This dialog only detects shortcuts that are not actively " +
    "intercepted by Gnome shell, e.g., natively or through an extension.\n\n" +
    "Press <b>ESC</b> to close the dialog.\n" +
    "Press <b>BackSpace</b> to unset the keybinding.";

  #gc: GarbageCollection;
  #settings: ExtensionSettings;
  #schemaKey: SettingKey;
  #window: Gtk.Window;

  constructor({ settings, schemaKey, window, ...config }: ShortcutParams) {
    super({
      ...config,
      activatable: true,
      title: settings.settings_schema.get_key(schemaKey).get_summary(),
    });

    this.#gc = new GarbageCollection();
    this.#settings = settings;
    this.#schemaKey = schemaKey;
    this.#window = window;

    const label = new Gtk.Label({
      ellipsize: Pango.EllipsizeMode.END,
      label: this.#label(),
      use_markup: true,
      xalign: 0,
    });

    const resetBtn = new Gtk.Button({
      valign: Gtk.Align.CENTER,
      icon_name: "edit-clear-symbolic",
      tooltip_text: "Reset the shortcut to its default value",
      css_classes: ["flat", "circular"],
      visible: this.#isCustomized(),
    });

    this.add_suffix(label);
    this.add_suffix(resetBtn);

    this.connect("activated", this.#onRebindKey.bind(this));
    resetBtn.connect("clicked", () => this.#settings.reset(this.#schemaKey));
    const chid = this.#settings.connect(`changed::${schemaKey}`, () => {
      label.label = this.#label();
      resetBtn.visible = this.#isCustomized();
    });
    this.#gc.defer(() => this.#settings.disconnect(chid));
  }

  release(): void {
    this.#gc.release();
  }

  #isCustomized() {
    return this.#settings.get_user_value(this.#schemaKey) !== null;
  }

  #escape(s: string) {
    return s.replace(/(<|>)/g, (c) => ({
      "<": "&lt;",
      ">": "&gt;",
    }[c]!));
  }

  #label() {
    const current = this.#settings.get_strv(this.#schemaKey);
    const shortcuts = current.length > 0
      ? this.#escape(current.join(", "))
      : this.#escape("<Unset>");

    return this.#isCustomized() ? `<b>${shortcuts}</b>` : shortcuts;
  }

  #addKeybinding(shortcut: string) {
    const set = new Set([...this.#settings.get_strv(this.#schemaKey), shortcut]);
    this.#settings.set_strv(this.#schemaKey, Array.from(set));
  }

  #replaceKeybinding(shortcut: string) {
    this.#settings.set_strv(this.#schemaKey, [shortcut]);
  }

  #unsetKeybinding() {
    this.#settings.set_strv(this.#schemaKey, []);
  }

  #onRebindKey() {
    // `undefined` resembles the state which awaits user input
    // `null` resembles an unbound/empty shortcut (ε)
    let acceleratorName: string | null | undefined = undefined;

    const eventController = new Gtk.EventControllerKey({
      propagation_phase: Gtk.PropagationPhase.CAPTURE,
    });

    const dialog = new Adw.MessageDialog({
      heading: "Set shortcut",
      body: `await input…\n\n${ShortcutRow.helpText}`,
      body_use_markup: true,
      modal: true,
      transient_for: this.#window,
    });
    dialog.add_controller(eventController);

    dialog.add_response("add", "Add shortcut");
    dialog.set_response_appearance("add", Adw.ResponseAppearance.SUGGESTED);
    dialog.set_response_enabled("add", false);

    dialog.add_response("replace", "Replace shortcut(s)");
    dialog.set_response_appearance("replace", Adw.ResponseAppearance.DESTRUCTIVE);
    dialog.set_response_enabled("replace", false);

    dialog.connect("response", (_, response: "add" | "replace" | "close") => {
      if (acceleratorName === null) {
        this.#unsetKeybinding();
      } else if (acceleratorName) {
        response === "add" && this.#addKeybinding(acceleratorName);
        response === "replace" && this.#replaceKeybinding(acceleratorName);
      }

      dialog.close();
    });

    eventController.connect("key-pressed", (ctrl, _, code, state) => {
      const event = ctrl.get_current_event() as Gdk.KeyEvent;
      const display = event.get_display()!;
      const { keyval, modifier } =
        this.#normalizeKeyvalAndMask(display, code, state, ctrl.get_group());

      if (event.is_modifier()) {
        return Gdk.EVENT_STOP;
      }

      switch (keyval) {
        case Gdk.KEY_Escape:
          // triggers "response" callback
          dialog.close();
          return Gdk.EVENT_STOP;
        case Gdk.KEY_BackSpace:
          acceleratorName = null;
          break;
        case Gdk.KEY_Return:
          if (modifier === 0) {
            // <Enter> may confirm a shortcut, if one was recognized already.
            // But <Enter> may also serve as legitimate shortcut on its own.
            // To differentiate between the two cases, it is checked whether
            // another shortcut had already been provided.
            if (acceleratorName === undefined) {
              acceleratorName = Gtk.accelerator_name(keyval, modifier);
              break;
            } else if (acceleratorName === null) {
              this.#unsetKeybinding();
              dialog.close();
            } else {
              this.#replaceKeybinding(acceleratorName);
              dialog.close();
            }
            return Gdk.EVENT_STOP;
          }
          // intentionally fallthrough
        default:
          acceleratorName = Gtk.accelerator_name(keyval, modifier)!;
      }

      const name = acceleratorName ?? "<Unset>";
      dialog.body = `${this.#escape(name)}\n\n${ShortcutRow.helpText}`;
      dialog.set_response_enabled("replace", true);
      dialog.set_response_enabled("add", acceleratorName !== null);

      return Gdk.EVENT_STOP;
    });

    dialog.present();
  }

  // https://gitlab.gnome.org/GNOME/gnome-control-center/-/blob/a936ac6bc9d5a01dd2c3fcb905189570ecd72753/panels/keyboard/keyboard-shortcuts.c#L388
  #normalizeKeyvalAndMask(
    display: Gdk.Display,
    code: number,
    mask: Gdk.ModifierType,
    keyGroup: number
  ): KeyPressEvent {
    // Note that GDK may add internal values to events which include values
    // outside of the Gdk.ModifierType enumeration. Usually the code should
    // preserve and ignore them.
    // That being said, the `Gdk.Display.translate_key` method throws an error
    // when these internal values are preserved. Thus, for the purpose of
    // normalization it is vital to ignore these bits beforehand.
    // https://gitlab.gnome.org/GNOME/gtk/-/blob/69500f356e61e437853f44c992c9bbca2ae5f8f7/gdk/gdkenums.h#L111-113
    mask &= Gdk.MODIFIER_MASK;

    let explicitModifiers = Gtk.accelerator_get_default_mod_mask();

    // We want shift to always be included as explicit modifier for gnome-shell
    // shortcuts.That's because users usually think of shortcuts as including
    // the shift key rather than being defined for the shifted keyval.
    // This helps with num - row keys which have different keyvals on different
    // layouts for example, but also with keys that have explicit key codes at
    // shift level 0, that gnome-shell would prefer over shifted ones, such the
    // DOLLAR key.
    explicitModifiers |= Gdk.ModifierType.SHIFT_MASK;

    // CapsLock isn't supported as a keybinding modifier, so keep it from
    // confusing us.
    // https://gitlab.gnome.org/GNOME/gnome-control-center/-/blob/a936ac6bc9d5a01dd2c3fcb905189570ecd72753/panels/keyboard/cc-keyboard-shortcut-editor.c#L713
    explicitModifiers &= ~Gdk.ModifierType.LOCK_MASK;

    const usedModifiers = mask & explicitModifiers;

    let [, unmodifiedKeyval] = display.translate_key(
      code, mask & ~explicitModifiers, keyGroup);
    const [, shiftedKeyval] = display.translate_key(
      code, Gdk.ModifierType.SHIFT_MASK | (mask & ~explicitModifiers), keyGroup);

    if (Gdk.KEY_0 <= shiftedKeyval && shiftedKeyval <= Gdk.KEY_9) {
      unmodifiedKeyval = shiftedKeyval;
    }

    if (unmodifiedKeyval === Gdk.KEY_ISO_Left_Tab) {
      unmodifiedKeyval = Gdk.KEY_Tab;
    }

    if (
      unmodifiedKeyval === Gdk.KEY_Sys_Req &&
      (usedModifiers & Gdk.ModifierType.ALT_MASK) != 0
    ) {
      unmodifiedKeyval = Gdk.KEY_Print;
    }

    return { keyval: unmodifiedKeyval, modifier: usedModifiers };
  }
});
