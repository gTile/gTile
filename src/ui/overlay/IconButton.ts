import GObject from 'gi://GObject?version=2.0';
import St from 'gi://St?version=13';

import { Theme } from '../../types/theme.js';
import TextButton, { ButtonParams } from './TextButton.js';

export interface IconButtonParams extends Omit<
  ButtonParams,
  "style_class" | "child"
> {
  theme: Theme;
  symbol: "animation" | "auto-close" | "main-and-list" | "two-list";
}

/**
 * Simple wrapper to display a button with a custom (CSS-defined) icon.
 */
export default GObject.registerClass({
  GTypeName: "GTileOverlayIconButton",
}, class extends TextButton {
  constructor({ theme, symbol, ...params }: IconButtonParams) {
    super({
      ...params,
      style_class: `${theme}__action-button`,
      child: new St.BoxLayout({
        style_class: `${theme}__action-button--${symbol}`,
        reactive: true,
        can_focus: true,
        track_hover: true
      }),
    });
  }
});
