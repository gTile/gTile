import GObject from "gi://GObject?version=2.0";
import St from "gi://St?version=13";

import { Rectangle } from "../types/grid.js";
import { Theme } from "../types/theme.js";

export interface PreviewParams extends Omit<
  St.BoxLayout.ConstructorProperties,
  "visible"
> {
  theme: Theme;
  animate?: boolean;
}

/**
 * A simple overlay that is used to visualize the area on the screen which is
 * currently selected in the grid.
 */
export default GObject.registerClass({
  GTypeName: "GTilePreview",
  Properties: {
    animate: GObject.ParamSpec.boolean(
      "animate",
      "Animate",
      "Whether to anmiate preview changes",
      GObject.ParamFlags.READWRITE,
      true,
    ),
  }
}, class extends St.BoxLayout {
  #animate: boolean;

  constructor({ theme, animate = true, ...params }: PreviewParams) {
    super({
      style_class: `${theme}__preview`,
      visible: false,
      ...params,
    });

    this.#animate = animate;
    this.add_style_pseudo_class("activate");
  }

  /**
   * Whether to animate changes to the {@link previewArea}.
   */
  set animate(animate: boolean) {
    this.#animate = animate;
  }

  get animate() {
    return this.#animate;
  }

  /**
   * The work area that the widget is rendered on.
   */
  set previewArea(area: Rectangle | null) {
    this.visible = !!area;

    if (area) {
      // Use default easing (AnimationMode.EASE_OUT_QUAD with 250ms duration)
      this.animate && this.save_easing_state();

      this.x = area.x;
      this.y = area.y;
      this.width = area.width;
      this.height = area.height;

      this.animate && this.restore_easing_state();
    }
  }
});
