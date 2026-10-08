import Clutter from "gi://Clutter";
import GObject from "gi://GObject";
import St from "gi://St";

import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";

interface PanelButtonParams extends Partial<GObject.Object.ConstructorProps> {
  theme: string;
}

/**
 * The button thats displayed in the Gnome panel and allows to toggle gTile.
 *
 * Emits `activated` for pointer, touch, and keyboard activation. GNOME 51
 * uses Clutter controllers for panel input instead of raw event handlers.
 */
export default class PanelButton extends PanelMenu.Button {
  declare connect: GObject.SignalMethods<this, St.Widget.SignalSignatures & {
    activated: () => void;
  }>["connect"];
  declare emit: GObject.SignalMethods<this, St.Widget.SignalSignatures & {
    activated: () => void;
  }>["emit"];
  static {
    GObject.registerClass({
      GTypeName: "GTilePanelButton",
      Signals: { activated: {} },
    }, this);
  }

  constructor({ theme }: PanelButtonParams) {
    super(0, "gTile", true);

    const icon = new St.Icon({ style_class: "system-status-icon" });
    this.add_child(icon);
    this.add_style_class_name(`${theme}__icon`);

    // Actions belong to the actor and are released when it is destroyed.
    const click = new Clutter.ClickGesture();
    click.set_recognize_on_press(true);
    click.connect("recognize", () => this.emit("activated"));
    this.add_action(click);

    const key = new Clutter.KeyController();
    key.connect("key-press", () => {
      const [, symbol] = key.get_key();
      if (symbol === Clutter.KEY_Return || symbol === Clutter.KEY_KP_Enter ||
          symbol === Clutter.KEY_space) {
        this.emit("activated");
        return Clutter.EVENT_STOP;
      }
      return Clutter.EVENT_PROPAGATE;
    });
    this.add_action(key);
  }
};
