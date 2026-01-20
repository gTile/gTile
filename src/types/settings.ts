import Gio from "gi://Gio";
import GObject from "gi://GObject";

import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";

/**
 * Key names in the GSettings schema that reference a boolean value.
 */
export type BoolSettingKey =
  | "auto-close"
  | "auto-maximize"
  | "follow-cursor"
  | "global-auto-tiling"
  | "global-presets"
  | "moveresize-enabled"
  | "show-grid-lines"
  | "show-icon"
  | "target-presets-to-monitor-of-mouse";

/**
 * Key names in the GSettings schema that reference a numeric value.
 */
export type NumberSettingKey =
  | "insets-primary-top"
  | "insets-primary-right"
  | "insets-primary-bottom"
  | "insets-primary-left"
  | "insets-secondary-top"
  | "insets-secondary-right"
  | "insets-secondary-bottom"
  | "insets-secondary-left"
  | "max-timeout"
  | "selection-timeout"
  | "window-spacing";

/**
 * Key names in the GSettings schema that reference a string value.
 */
export type StringSettingKey =
  | "autotile-gridspec-1"
  | "autotile-gridspec-2"
  | "autotile-gridspec-3"
  | "autotile-gridspec-4"
  | "autotile-gridspec-5"
  | "autotile-gridspec-6"
  | "autotile-gridspec-7"
  | "autotile-gridspec-8"
  | "autotile-gridspec-9"
  | "autotile-gridspec-10"
  | "autotile-main-window-ratios"
  | "grid-sizes"
  | "resize1"
  | "resize10"
  | "resize11"
  | "resize12"
  | "resize13"
  | "resize14"
  | "resize15"
  | "resize16"
  | "resize17"
  | "resize18"
  | "resize19"
  | "resize2"
  | "resize20"
  | "resize21"
  | "resize22"
  | "resize23"
  | "resize24"
  | "resize25"
  | "resize26"
  | "resize27"
  | "resize28"
  | "resize29"
  | "resize3"
  | "resize30"
  | "resize4"
  | "resize5"
  | "resize6"
  | "resize7"
  | "resize8"
  | "resize9"
  | "theme";

/**
 * Key names in the GSettings schema that reference keyboard shortcuts which are
 * always intercepted for as long as the extension is enabled.
 */
export type KeyBindingGlobalSettingKey = "show-toggle-tiling";

/**
 * Key names in the GSettings schema that reference keyboard shortcuts which are
 * intercepted while the gTile overlay is visible.
 */
export type KeyBindingGroupDefaultSettingKey =
  | "cancel-tiling"
  | "change-grid-size"
  | "move-up"
  | "move-right"
  | "move-down"
  | "move-left"
  | "move-next-monitor"
  | "contract-left"
  | "contract-right"
  | "contract-up"
  | "contract-down"
  | "expand-left"
  | "expand-right"
  | "expand-up"
  | "expand-down"
  | "set-tiling"
  | "snap-to-neighbors";

/**
 * Key names in the GSettings schema that reference keyboard shortcuts which are
 * related to the autotiling feature. The user can choose whether to have them
 * always activated or only when the overlay is visible (default).
 */
export type KeyBindingGroupAutotileSettingKey =
  | "autotile-main"
  | "autotile-main-inverted"
  | "autotile-1"
  | "autotile-2"
  | "autotile-3"
  | "autotile-4"
  | "autotile-5"
  | "autotile-6"
  | "autotile-7"
  | "autotile-8"
  | "autotile-9"
  | "autotile-10";

/**
 * Key names in the GSettings schema that reference keyboard shortcuts which are
 * related to window panning and resizing. The user can choose whether to have
 * them always activated (default) or only when the overlay is visible.
 */
export type KeyBindingGroupActionSettingKey =
  | "action-autotile-main"
  | "action-autotile-main-inverted"
  | "action-change-tiling"
  | "action-contract-top"
  | "action-contract-right"
  | "action-contract-bottom"
  | "action-contract-left"
  | "action-expand-top"
  | "action-expand-right"
  | "action-expand-bottom"
  | "action-expand-left"
  | "action-move-up"
  | "action-move-right"
  | "action-move-down"
  | "action-move-left"
  | "action-move-next-monitor";

/**
 * Key names in the GSettings schema that reference keyboard shortcuts which are
 * related to the preset feature. The user can choose whether to have them
 * always activated (default) or only when the overlay is visible.
 */
export type KeyBindingGroupPresetSettingKey =
  | "preset-resize-1"
  | "preset-resize-2"
  | "preset-resize-3"
  | "preset-resize-4"
  | "preset-resize-5"
  | "preset-resize-6"
  | "preset-resize-7"
  | "preset-resize-8"
  | "preset-resize-9"
  | "preset-resize-10"
  | "preset-resize-11"
  | "preset-resize-12"
  | "preset-resize-13"
  | "preset-resize-14"
  | "preset-resize-15"
  | "preset-resize-16"
  | "preset-resize-17"
  | "preset-resize-18"
  | "preset-resize-19"
  | "preset-resize-20"
  | "preset-resize-21"
  | "preset-resize-22"
  | "preset-resize-23"
  | "preset-resize-24"
  | "preset-resize-25"
  | "preset-resize-26"
  | "preset-resize-27"
  | "preset-resize-28"
  | "preset-resize-29"
  | "preset-resize-30";

/**
 * Key names in the GSettings schema that reference keyboard shortcuts.
 */
export type KeyBindingSettingKey =
  | KeyBindingGlobalSettingKey
  | KeyBindingGroupDefaultSettingKey
  | KeyBindingGroupAutotileSettingKey
  | KeyBindingGroupActionSettingKey
  | KeyBindingGroupPresetSettingKey;

/**
 * Key names in the GSettings schema.
 */
export type SettingKey =
  | BoolSettingKey
  | NumberSettingKey
  | StringSettingKey
  | KeyBindingSettingKey
  | "themes";

type ExtendedSettings<P extends string> = Gio.Settings & {
  // This is only a convenience signature that enables auto-completion. It does
  // not prevent the user from providing any string as sigName and thus does not
  // guarantee type safety.
  connect(sigName: `changed::${P}`, callback: (...args: any[]) => void): number;
};

/**
 * An extension agnostic type-safe variant of {@link Gio.Settings}.
 */
export interface NamedSettings<
  B extends string,
  N extends string,
  S extends string
> extends ExtendedSettings<B | N | S> {
  bind(
    key: B | N | S,
    object: GObject.Object,
    property: string,
    flags: Gio.SettingsBindFlags
  ): void;
  get_boolean(key: B): boolean;
  set_boolean(key: B, value: boolean): boolean;
  get_int(key: N): number;
  set_int(key: N, value: number): boolean;
  get_string(key: S): string;
  set_string(key: S, value: string): boolean;
}

/**
 * Type-safe variant of {@link Gio.Settings}.
 */
export type ExtensionSettings = NamedSettings<
  BoolSettingKey,
  NumberSettingKey,
  StringSettingKey
>;

/**
 * Provides a type-safe {@link Gio.Settings} instance.
 */
export interface ExtensionSettingsProvider extends Extension {
  get settings(): ExtensionSettings;
}
