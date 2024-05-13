import GObject from "gi://GObject";
import St from "gi://St";

import { Theme } from "../../types/theme.js";

export interface ThemedContainerParams extends Partial<St.Bin.ConstructorProps> {
  theme: Theme;
}

export interface StyledContainerParams extends Partial<St.Bin.ConstructorProps> {
  style_class: string;
}

/**
 * A generic container used for styling purposes.
 */
export default GObject.registerClass({
  GTypeName: "GTileOverlayContainer"
}, class extends St.Bin {
  /**
   * @returns A generic container with the default style.
   */
  static new_themed({ theme, ...params }: ThemedContainerParams) {
    return this.new_styled({
      ...params,
      style_class: `${theme}__container`,
    });
  }

  /**
   * @returns A generic container with a customized style.
   */
  static new_styled(params: StyledContainerParams) {
    return new this({
      reactive: true,
      can_focus: true,
      track_hover: true,
      ...params,
    });
  }
})
