import { Inset } from "../types/grid.js";
import { ExtensionSettings } from "../types/settings.js";

/**
 * Provides user preferences.
 */
export interface UserPreferencesProvider {
  getInset(primary: boolean): Inset;
  getWindowMargin(): number;
}

export interface UserPreferencesParams {
  settings: ExtensionSettings;
}

/**
 * A simple store that provides user preferences.
 */
export default class implements UserPreferencesProvider {
  #settings: ExtensionSettings;

  constructor({ settings }: UserPreferencesParams) {
    this.#settings = settings;
  }

  /**
   * The monitor inset to be respected when performing window resize operations.
   *
   * @param primary Whether to request the inset for the primary monitor.
   * @returns The inset for the requested monitor (primary or secondary).
   */
  getInset(primary: boolean): Inset {
    const setting = primary ? "primary" : "secondary";

    return {
      top: this.#settings.get_int(`insets-${setting}-top`),
      bottom: this.#settings.get_int(`insets-${setting}-bottom`),
      left: this.#settings.get_int(`insets-${setting}-left`),
      right: this.#settings.get_int(`insets-${setting}-right`),
    };
  }

  /**
   * The margin between two adjacent windows.
   *
   * @returns The margin in pixels.
   */
  getWindowMargin(): number {
    return this.#settings.get_int(`window-margin`);
  }
}
