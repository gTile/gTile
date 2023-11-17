/// <reference path="./node_modules/@girs/gjs/dom.d.ts" />
/// <reference path="./node_modules/@girs/gnome-shell/dist/index-ambient.d.ts" />

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
