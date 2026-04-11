import Clutter from "gi://Clutter";
import GObject from "gi://GObject";
import St from "gi://St";

const MAX_BUTTONS_PER_ROW = 4;

export interface ButtonBarParams extends Partial<St.Widget.ConstructorProps> {}

export interface StyledButtonBarParams extends ButtonBarParams {
  style_class: string;
}

/**
 * A styled container for {@link St.Button} elements.
 * Uses CSS for dimensions - all sizing is handled via em units in the stylesheet.
 */
export default GObject.registerClass({
  GTypeName: "GTileOverlayButtonBar"
}, class extends St.Widget {
  /**
   * @returns A button container with a customized style.
   */
  static new_styled(params: StyledButtonBarParams) {
    return new this({
      ...params,
      reactive: true,
      can_focus: true,
      track_hover: true,
      x_expand: true,
      layout_manager: new Clutter.GridLayout({ column_homogeneous: true }),
    });
  }

  /**
   * Places a button in the container. New buttons are placed from left to right
   * unless a column exceeds {@link MAX_BUTTONS_PER_ROW}, which causes the
   * button to be placed in a new row.
   *
   * @param button The button to be added.
   */
  addButton(button: St.Button) {
    const n = this.get_n_children();
    const col = n % MAX_BUTTONS_PER_ROW;
    const row = Math.floor(n / MAX_BUTTONS_PER_ROW);

    this.#layout.attach(button, col, row, 1, 1);
  }

  /**
   * Destroys all buttons that were added to the container thus far.
   */
  removeButtons() {
    this.destroy_all_children();
  }

  get #layout() {
    return this.layout_manager as Clutter.GridLayout;
  }
})
