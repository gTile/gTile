import GObject from "gi://GObject?version=2.0"
import St from "gi://St?version=13";

import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";

interface PanelButtonParams extends GObject.Object.ConstructorProperties {
  theme: string;
}

/**
 * The button thats displayed in the Gnome panel and allows to toggle gTile.
 *
 * Note that this class extends PanelMenu.Button which has no `clicked` signal
 * because it extends St.Widget (as opposed to St.Button). Instead, the
 * `button-press-event` has to be listened on.
 */
export default GObject.registerClass({
  GTypeName: "GTilePanelButton",
}, class extends PanelMenu.Button {
  // @ts-ignore
  constructor(params: PanelButtonParams);

  _init() {
    super._init(.0, "gTile", true);

    // Workaround to avoid messing up the the method signature of _init which
    // TypeScript expects to stay compatible with those of the parent classes.
    // The current way to extend these classes however is to override _init with
    // the desired constructor signature. This breaks polymorphism and will
    // hopefully be deprecated soon in favor of the regular constructor.
    const { theme } = arguments[0] as PanelButtonParams;

    const icon = new St.Icon({ style_class: "system-status-icon" });
    this.add_child(icon);
    this.add_style_class_name(`${theme}__icon`);
  }
});
