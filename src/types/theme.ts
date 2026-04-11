/**
 * A validated theme identifier — the CSS class applied to the root container
 * of all themed widgets (e.g. "gtile-default", "gtile-minimal-dark").
 *
 * This is a branded string: it can only be produced by {@link getActiveTheme},
 * which guarantees the value is either a known theme or the default fallback.
 * Raw strings from GSettings must pass through that function first.
 *
 * Icon theming is handled entirely in CSS via descendant selectors.
 */
export type Theme = string & { readonly __brand: "Theme" };
