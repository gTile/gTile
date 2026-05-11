import { ExtensionSettings } from "../types/settings.js";
import { Theme } from "../types/theme.js";
import { getActiveTheme, validateThemes } from "./theme.js";

type ThemeListener = (theme: Theme) => void;

/**
 * Observes the "themes" and "theme" GSettings keys and notifies subscribers
 * whenever the active theme changes.
 *
 * Components that need the current theme receive a ThemeStore instead of a
 * plain Theme value. They subscribe to changes themselves, eliminating the
 * need for a central coordinator to manually push updates to each component.
 */
export default class ThemeStore {
  #theme: Theme;
  #listeners = new Set<ThemeListener>();

  constructor(private readonly settings: ExtensionSettings) {
    this.#theme = this.#derive();
  }

  get theme(): Theme {
    return this.#theme;
  }

  /**
   * Registers a listener that will be called whenever the active theme changes.
   * Returns an unsubscribe function.
   */
  subscribe(cb: ThemeListener): () => void {
    this.#listeners.add(cb);
    return () => this.#listeners.delete(cb);
  }

  /**
   * Forces a notification to all subscribers with the current theme.
   * Useful to re-apply theme after GNOME Shell has parsed the extension CSS.
   */
  forceNotify() {
    this.#theme = this.#derive();
    this.#notify();
  }

  /** Called by App when the "theme" setting changes. */
  onSettingChanged() {
    const next = this.#derive();
    if (next === this.#theme) return;
    this.#theme = next;
    this.#notify();
  }

  #derive(): Theme {
    const themes = validateThemes(this.settings.get_strv("themes"));
    return getActiveTheme(themes, this.settings.get_string("theme"));
  }

  release() {
    this.#listeners.clear();
  }

  #notify() {
    for (const cb of this.#listeners) {
      cb(this.#theme);
    }
  }
}
