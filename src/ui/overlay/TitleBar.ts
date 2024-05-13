import Clutter from "gi://Clutter";
import GObject from "gi://GObject";
import St from "gi://St";

import { Theme } from "../../types/theme.js"

export interface TitleBarParams extends Partial<St.Widget.ConstructorProps> {
  theme: Theme;
  title: string;
}

/**
 * A simple title bar for dialogs. It uses a horizontal box layout to display a
 * close button and a title text next to it like this:
 *
 * [x] <Title>
 *
 * A `closed` signal is emitted when the user clicks the close button.
 */
export default GObject.registerClass({
  GTypeName: "GTileOverlayTitleBar",
  Signals: {
    closed: {},
  }
}, class extends St.Widget {
  #label: St.Label;

  constructor({ theme, title, ...params }: TitleBarParams) {
    super({
      style_class: `gtile-testtest`,
      layout_manager: new Clutter.BoxLayout(),
      ...params,
    });

    // --- initialize ---
    const closeBtn = new St.Button({
      style_class: [
        `${theme}__close-container`,
        `${theme}__close`,
      ].join(" "),
    });

    this.#label = new St.Label({
      style_class: `${theme}__title`,
      text: title,
    });

    // --- show  UI ---
    this.add_child(closeBtn);
    this.add_child(this.#label);

    // --- event handlers ---
    closeBtn.connect("clicked", () => { this.emit("closed");  });
  }

  set title(title: string) {
    this.#label.text = title;
  }

  get title(): string {
    return this.#label.text ?? "";
  }
});
