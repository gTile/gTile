import GObject from "gi://GObject";
import St from "gi://St";

import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";

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
  constructor() {
    super(0.0, "gTile", true);

    const icon = new St.Icon({
      style_class: `system-status-icon gtile-icon`,
    });
    this.add_child(icon);
  }
});
