import GObject from "gi://GObject";

import TextButton, { ButtonParams } from "./TextButton.js";

export interface IconButtonParams extends Omit<ButtonParams, "style_class"> {
  symbol: "auto-close" | "follow-cursor" | "main-and-list" | "two-list";
}

/**
 * Simple wrapper to display a button with a custom (CSS-defined) icon.
 */
export default GObject.registerClass({
  GTypeName: "GTileOverlayIconButton",
}, class extends TextButton {
  constructor({ symbol, ...params }: IconButtonParams) {
    super({
      ...params,
      style_class: `gtile-action-button gtile-action-button--${symbol}`,
    });
  }
});
