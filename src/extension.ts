import GLib from "gi://GLib?version=2.0";

import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";

import App from "./core/App.js";
import { ExtensionSettings, ExtensionSettingsProvider } from "./types/settings.js";

export default class extends Extension implements ExtensionSettingsProvider {
  #app?: ReturnType<typeof App.run>;
  #settings?: ExtensionSettings;

  enable() {
    console.log(`Enable ${this.metadata.uuid} (GLib v${GLib.MAJOR_VERSION}.${GLib.MINOR_VERSION}.${GLib.MICRO_VERSION})`);

    this.#app = App.run(this);
  }

  disable() {
    this.#app?.release();
    this.#app = undefined;
    this.#settings = undefined;
  }

  get settings(): ExtensionSettings {
    if (!this.#settings) {
      // checks for a schema in the `schemas/` directory and creates a new
      // Gio.SettingsSchemaSource and Gio.Settings instance on each invokation.
      this.#settings = this.getSettings();
    }

    return this.#settings;
  }
}
