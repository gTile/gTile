import GObject from "gi://GObject";
import St from "gi://St";

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
   * @returns A generic container with a customized style.
   */
  static new_styled(params: StyledContainerParams) {
    return new this({ x_expand: true, ...params });
  }
})
