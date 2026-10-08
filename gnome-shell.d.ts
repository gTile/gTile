/// <reference path="./node_modules/@girs/gjs/dom.d.ts" />
/// <reference path="./node_modules/@girs/gjs/gjs.d.ts" />
/// <reference path="./node_modules/@girs/adw-1/index.d.ts" />
/// <reference path="./node_modules/@girs/clutter-51/index.d.ts" />
/// <reference path="./node_modules/@girs/gdk-4.0/index.d.ts" />
/// <reference path="./node_modules/@girs/gio-2.0/index.d.ts" />
/// <reference path="./node_modules/@girs/glib-2.0/index.d.ts" />
/// <reference path="./node_modules/@girs/gobject-2.0/index.d.ts" />
/// <reference path="./node_modules/@girs/gtk-4.0/index.d.ts" />
/// <reference path="./node_modules/@girs/meta-51/index.d.ts" />
/// <reference path="./node_modules/@girs/mtk-51/index.d.ts" />
/// <reference path="./node_modules/@girs/pango-1.0/index.d.ts" />
/// <reference path="./node_modules/@girs/shell-51/index.d.ts" />
/// <reference path="./node_modules/@girs/st-51/index.d.ts" />

// Only the Shell JavaScript interfaces used here are declared below. The
// published @girs/gnome-shell package targets 50 and imports the obsolete
// Mutter 18 namespace. Native APIs use the generated GNOME 51 GI definitions.
// Checked against GNOME/gnome-shell tag 51.0, commit
// 2177bdf9624b2d285de7c1d34274073d3769d6b8.
declare module "resource:///org/gnome/shell/extensions/extension.js" {
  import Gio from "gi://Gio";

  export class Extension {
    readonly uuid: string;
    readonly metadata: { uuid: string };
    getSettings(schema?: string): Gio.Settings;
    enable(): void;
    disable(): void;
  }
}

declare module "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js" {
  import Adw from "gi://Adw";
  import Gio from "gi://Gio";

  export class ExtensionPreferences {
    getSettings(schema?: string): Gio.Settings;
    fillPreferencesWindow(window: Adw.PreferencesWindow): Promise<void>;
  }
}

declare module "resource:///org/gnome/shell/ui/layout.js" {
  import Clutter from "gi://Clutter";
  import GObject from "gi://GObject";
  import St from "gi://St";

  export interface Monitor {
    index: number;
    x: number;
    y: number;
    width: number;
    height: number;
    geometry_scale: number;
  }

  export class LayoutManager extends GObject.Object {
    connect: GObject.SignalMethods<this, GObject.Object.SignalSignatures & {
      "monitors-changed": () => void;
    }>["connect"];
    readonly monitors: Monitor[];
    readonly primaryIndex: number;
    readonly overviewGroup: St.Widget;
    addChrome(actor: Clutter.Actor): void;
    addTopChrome(actor: Clutter.Actor): void;
    removeChrome(actor: Clutter.Actor): void;
  }
}

declare module "resource:///org/gnome/shell/ui/windowManager.js" {
  import Gio from "gi://Gio";
  import Meta from "gi://Meta";
  import Shell from "gi://Shell";

  export interface WindowManager {
    addKeybinding(name: string, settings: Gio.Settings,
      flags: Meta.KeyBindingFlags, modes: Shell.ActionMode,
      handler: Meta.KeyHandlerFunc): number;
    removeKeybinding(name: string): void;
  }
}

declare module "resource:///org/gnome/shell/ui/panelMenu.js" {
  import St from "gi://St";

  export class Button extends St.Widget {
    constructor(menuAlignment: number, nameText: string,
      dontCreateMenu?: boolean);
    // Shell's JavaScript subclass still initializes through _init().
    _init(...args: unknown[]): void;
  }
}

declare module "resource:///org/gnome/shell/ui/main.js" {
  import { LayoutManager } from "resource:///org/gnome/shell/ui/layout.js";
  import { Button } from "resource:///org/gnome/shell/ui/panelMenu.js";
  import { WindowManager } from "resource:///org/gnome/shell/ui/windowManager.js";

  export const layoutManager: LayoutManager;
  export const wm: WindowManager;
  export const panel: {
    addToStatusArea(role: string, indicator: Button): void;
  };
}
