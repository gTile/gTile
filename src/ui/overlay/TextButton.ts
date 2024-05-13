import GObject from "gi://GObject";
import St from "gi://St";

import { Theme } from "../../types/theme.js";

export interface ButtonParams extends Partial<St.Button.ConstructorProps> {
  active?: boolean;
}

export interface ThemedButtonParams extends ButtonParams {
  theme: Theme;
}

export interface StyledButtonParams extends ButtonParams {
  style_class: string;
}

/**
 * A simple styled text button that has the notion of an `active` state.
 */
export default GObject.registerClass({
  GTypeName: "GTileOverlayTextButton",
  Properties: {
    "active": GObject.ParamSpec.boolean(
      "active",
      "Active",
      "Whether the button state is active",
      GObject.ParamFlags.READWRITE,
      false,
    ),
  }
}, class extends St.Button {
  #active!: boolean;

  /**
   * @returns A generic text button with the default style.
   */
  static new_themed({ theme, ...params }: ThemedButtonParams) {
    return this.new_styled({
      ...params,
      style_class: `${theme}__preset-button`,
    });
  }

  /**
   * @returns A generic text button with a customized style.
   */
  static new_styled({ active = false, ...params }: StyledButtonParams) {
    const instance = new this({
      reactive: true,
      can_focus: true,
      track_hover: true,
      ...params,
    });
    instance.active = active;

    return instance;
  }

  /**
   * Whether the button state is considered active.
   */
  set active(b: boolean) {
    this.#active = b;
    this.#updateState();
    this.notify("active");
  }

  get active(): boolean {
    return this.#active;
  }

  #updateState() {
    if (this.#active) {
      this.add_style_pseudo_class("activate");
    } else {
      this.remove_style_pseudo_class("activate");
    }
  }
});
