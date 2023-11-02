/// <reference path="./node_modules/@schnz/gjs/dom.d.ts" />

interface ImportMeta {
  url: string;
}

interface Math {
  /**
   * Returns {@link x} clamped to the inclusive range of {@link min} and {@link max}.
   * @see https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/8a8539ee6766058b39d0a5c0961a08f76799f4da/js/ui/environment.js#L357
   *
   * @param x The value to be clamped.
   * @param min The lower bound of the result.
   * @param max The upper bound of the result.
   */
  clamp(x: number, min: number, max: number): number;
}

declare module "resource:///org/gnome/shell/ui/panelMenu.js" {
  export type * from "@schnz/gnome-shell/src/ui/panelMenu.d.ts";
}

declare module "resource:///org/gnome/shell/ui/popupMenu.js" {
  export type * from "@schnz/gnome-shell/src/ui/popupMenu.js";
}

declare module "resource:///org/gnome/shell/ui/windowManager.js" {
  import type Clutter from 'gi://Clutter?version=13';
  import type Gio from 'gi://Gio?version=2.0';
  import type Meta from 'gi://Meta?version=13';
  import type Shell from 'gi://Shell?version=13';

  export declare class WindowManager {
    insertWorkspace(pos: number): void;

    setCustomKeybindingHandler(
      name: string,
      modes: Shell.ActionMode,
      handler: Meta.KeyHandlerFunc
    ): void;

    addKeybinding(
      name: string,
      settings: Gio.Settings,
      flags: Meta.KeyBindingFlags,
      modes: Shell.ActionMode,
      handler: Meta.KeyHandlerFunc,
    ): number;

    removeKeybinding(name: string): void;
    allowKeybinding(name: string, modes: Shell.ActionMode): void;

    handleWorkspaceScroll(event): boolean;
  }
}

declare module "resource:///org/gnome/shell/ui/main.js" {
  import type { WindowManager } from "resource:///org/gnome/shell/ui/windowManager.js";

  export declare const wm: WindowManager;
  export type * from "@schnz/gnome-shell/src/ui/main.d.ts";
}

declare module "resource:///org/gnome/shell/extensions/extension.js" {
  import type Gio from "gi://Gio";
  import type { ExtensionMetadata } from "@schnz/gnome-shell";

  export declare abstract class ExtensionBase {
    #private;
    metadata: ExtensionMetadata;

    /**
     * Look up an extension by URL (usually 'import.meta.url')
     *
     * @param {string} url - a file:// URL
     */
    static lookupByURL(url: string): ExtensionBase | null;

    /**
     * Look up an extension by UUID
     *
     * @param {string} _uuid
     */
    static lookupByUUID(_uuid: string): void;

    /**
     * @param {object} metadata - metadata passed in when loading the extension
     */
    constructor(metadata: ExtensionMetadata);

    /**
     * @type {string}
     */
    get uuid(): string;

    /**
     * @type {Gio.File}
     */
    get dir(): Gio.File;

    /**
     * @type {string}
     */
    get path(): string;

    /**
     * Get a GSettings object for schema, using schema files in
     * extensionsdir/schemas. If schema is omitted, it is taken
     * from metadata['settings-schema'].
     *
     * @param {string=} schema - the GSettings schema id
     *
     * @returns {Gio.Settings}
     */
    getSettings(schema?: string): Gio.Settings;

    /**
     * Initialize Gettext to load translations from extensionsdir/locale. If
     * domain is not provided, it will be taken from metadata['gettext-domain']
     * if provided, or use the UUID
     *
     * @param {string=} domain - the gettext domain to use
     */
    initTranslations(domain?: string): void;
    /**
     * Translate `str` using the extension's gettext domain
     *
     * @param {string} str - the string to translate
     *
     * @returns {string} the translated string
     */
    gettext(str: string): string | null;
    /**
     * Translate `str` and choose plural form using the extension's
     * gettext domain
     *
     * @param {string} str - the string to translate
     * @param {string} strPlural - the plural form of the string
     * @param {number} n - the quantity for which translation is needed
     *
     * @returns {string} the translated string
     */
    ngettext(str: string, strPlural: string, n: number): string | null;
    /**
     * Translate `str` in the context of `context` using the extension's
     * gettext domain
     *
     * @param {string} context - context to disambiguate `str`
     * @param {string} str - the string to translate
     *
     * @returns {string} the translated string
     */
    pgettext(context: string, str: string): string | null;
  }
  export declare class GettextWrapper {
    #private;
    constructor(extensionClass: typeof ExtensionBase, url?: string);
    defineTranslationFunctions(): {
      /**
       * Translate `str` using the extension's gettext domain
       *
       * @param {string} str - the string to translate
       *
       * @returns {string} the translated string
       */
      gettext: (str: string) => string | null;
      /**
       * Translate `str` and choose plural form using the extension's
       * gettext domain
       *
       * @param {string} str - the string to translate
       * @param {string} strPlural - the plural form of the string
       * @param {number} n - the quantity for which translation is needed
       *
       * @returns {string} the translated string
       */
      ngettext: (str: string, strPlural: string, n: number) => string | null;
      /**
       * Translate `str` in the context of `context` using the extension's
       * gettext domain
       *
       * @param {string} context - context to disambiguate `str`
       * @param {string} str - the string to translate
       *
       * @returns {string} the translated string
       */
      pgettext: (context: string, str: string) => string | null;
    };
  }
  export declare class Extension extends ExtensionBase {
    static lookupByUUID(uuid: string): Extension;
    static defineTranslationFunctions(url?: string): {
      /**
       * Translate `str` using the extension's gettext domain
       *
       * @param {string} str - the string to translate
       *
       * @returns {string} the translated string
       */
      gettext: (str: string) => string | null;
      /**
       * Translate `str` and choose plural form using the extension's
       * gettext domain
       *
       * @param {string} str - the string to translate
       * @param {string} strPlural - the plural form of the string
       * @param {number} n - the quantity for which translation is needed
       *
       * @returns {string} the translated string
       */
      ngettext: (str: string, strPlural: string, n: number) => string | null;
      /**
       * Translate `str` in the context of `context` using the extension's
       * gettext domain
       *
       * @param {string} context - context to disambiguate `str`
       * @param {string} str - the string to translate
       *
       * @returns {string} the translated string
       */
      pgettext: (context: string, str: string) => string | null;
    };
    enable(): void;
    disable(): void;
    /**
     * Open the extension's preferences window
     */
    openPreferences(): boolean;
  }

  export declare const gettext: (str: string) => string | null,
    ngettext: (str: string, strPlural: string, n: number) => string | null,
    pgettext: (context: string, str: string) => string | null;

  export declare class InjectionManager {
    #private;

    /**
     * @callback CreateOverrideFunc
     * @param {Function?} originalMethod - the original method if it exists
     * @returns {Function} - a function to be used as override
     */

    /**
     * Modify, replace or inject a method
     *
     * @param {object} prototype - the object (or prototype) that is modified
     * @param {string} methodName - the name of the overwritten method
     * @param {CreateOverrideFunc} createOverrideFunc - function to call to create the override
     */
    overrideMethod(
      prototype: object,
      methodName: string,
      createOverrideFunc: (originalMethod?: Function) => Function
    ): void;

    /**
     * Restore the original method
     *
     * @param {object} prototype - the object (or prototype) that is modified
     * @param {string} methodName - the name of the method to restore
     */
    restoreMethod(
      prototype: {
        [k: string]: any;
      },
      methodName: string
    ): void;

    /**
     * Restore all original methods and clear overrides
     */
    clear(): void;

    _saveMethod(
      prototype: {
        [k: string]: any;
      },
      methodName: string
    ): any;

    _installMethod(
      prototype: {
        [k: string]: any;
      },
      methodName: string,
      method: Function
    ): void;
  }
}

declare module "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js" {
  import type Adw from 'gi://Adw?version=1';
  import type {
    GettextWrapper,
    Extension,
    ExtensionBase,
  } from "resource:///org/gnome/shell/extensions/extension.js";

  type TFuncs = ReturnType<InstanceType<typeof GettextWrapper>['defineTranslationFunctions']>

  export declare class ExtensionPreferences extends ExtensionBase {
    static lookupByUUID(uuid: string): Extension | null;
    static defineTranslationFunctions(url: string): TFuncs;

    /**
     * Get the single widget that implements
     * the extension's preferences.
     *
     * @returns {Gtk.Widget}
     * @throws {GObject.NotImplementedError}
     */
    getPreferencesWidget(): void;

    /**
     * Fill the preferences window with preferences.
     *
     * The default implementation adds the widget
     * returned by getPreferencesWidget().
     *
     * @param {Adw.PreferencesWindow} window - the preferences window
     */
    fillPreferencesWindow(window: Adw.PreferencesWindow): void;
  }

  export type {
    gettext,
    ngettext,
    pgettext
  } from "resource:///org/gnome/shell/extensions/extension.js";
}
