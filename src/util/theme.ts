import { Theme } from "../types/theme.js";

export const DEFAULT_THEME = "gtile-default" as Theme;

export function themeLabel(cssClass: string): string {
  return cssClass
    .replace(/^gtile-/, "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}

export function validateThemes(themes: string[]): string[] {
  return themes.length > 0 ? themes : [DEFAULT_THEME];
}

export function getActiveTheme(themes: string[], cssClass: string | null): Theme {
  return (themes.find(t => t === cssClass) ?? DEFAULT_THEME) as Theme;
}
