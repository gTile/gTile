import Clutter from "gi://Clutter";
import GObject from "gi://GObject";
import St from "gi://St";

export interface TitleBarParams extends Partial<St.Widget.ConstructorProps> {
  title: string;
}

/**
 * A simple title bar for dialogs. It uses a horizontal box layout to display a
 * close button and a centered title like this:
 *
 * [x] ··· <Title> ···
 *
 * Two expanding spacers flank the label so it stays centered regardless of the
 * close button width. A `closed` signal is emitted when the user clicks the
 * close button.
 */
export default GObject.registerClass({
  GTypeName: "GTileOverlayTitleBar",
  Signals: {
    closed: {},
  }
}, class extends St.Widget {
  #label: St.Label;

  constructor({ title, ...params }: TitleBarParams) {
    super({
      style_class: `gtile-title-bar`,
      layout_manager: new Clutter.BoxLayout(),
      x_expand: true,
      ...params,
    });

    // --- initialize ---
    const closeBtn = new St.Button({
      style_class: `gtile-close`,
    });

    const leftSpacer = new St.Widget({
      style_class: `gtile-title-spacer`,
      x_expand: true,
    });

    this.#label = new St.Label({
      style_class: `gtile-title`,
      text: title,
      x_align: Clutter.ActorAlign.CENTER,
    });

    const rightSpacer = new St.Widget({
      style_class: `gtile-title-spacer`,
      x_expand: true,
    });

    // --- show  UI ---
    this.add_child(closeBtn);
    this.add_child(leftSpacer);
    this.add_child(this.#label);
    this.add_child(rightSpacer);

    // --- event handlers ---
    closeBtn.connect("clicked", () => { this.emit("closed"); });
  }

  set title(title: string) {
    this.#label.text = title;
  }

  get title(): string {
    return this.#label.text ?? "";
  }
});
