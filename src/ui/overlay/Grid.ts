import Clutter from "gi://Clutter";
import GObject from "gi://GObject";
import St from "gi://St";

import { GridOffset, GridSize, GridSelection } from "../../types/grid.js";
import { Theme } from "../../types/theme.js";
import TextButton from "./TextButton.js";

type TextButton = ReturnType<typeof TextButton.new_styled>;

export interface GridParams extends St.Widget.ConstructorProperties {
  theme: Theme

  /**
   * The dimensions of the grid in terms of columns and rows.
   */
  gridSize: GridSize;

  /**
   * Optional. The initial area of highlighted tiles in the grid.
   */
  selection?: GridSelection | null;

  /**
   * The width of the grid in pixels.
   */
  width: number;

  /**
   * The height of the grid in pixels.
   */
  height: number;
}

/**
 * A 2D grid that consists of {@link GridSize.cols}x{@link GridSize.rows} tiles.
 *
 * The grid is interactive in that it allows a certain rectangular area to be
 * highlighted. This can either happen programatically, i.e., by setting the
 * selection explicitly, or implicitly, i.e., by perfomring a tile selection
 * with the mouse.
 *
 * The grid exposes two native GObject properties (`grid-size` and `selection`)
 * that can be used for bidirectional data binding in addition to the limited
 * r/w access of regular properties. It also exposes a dedicated signal
 * (`selected`) that is fired when the user completes a grid selection.
 */
export default GObject.registerClass({
  GTypeName: "GTileOverlayGrid",
  Properties: {
    "grid-size": GObject.ParamSpec.jsobject(
      "grid-size",
      "Grid size",
      "The dimension of the grid in terms of columns and rows",
      GObject.ParamFlags.READWRITE,
    ),
    selection: GObject.ParamSpec.jsobject(
      "selection",
      "Selection",
      "A rectangular tile selection within the grid",
      GObject.ParamFlags.READWRITE,
    ),
    "hover-tile": GObject.ParamSpec.jsobject(
      "hover-tile",
      "Hover tile",
      "The currently hovered tile in the grid, if any",
      GObject.ParamFlags.READABLE,
    ),
  },
  Signals: {
    selected: {},
  }
}, class extends St.Widget {
  #theme: Theme;
  #gridSize!: GridSize;
  #selection!: GridSelection | null;
  #hoverTile: GridOffset | null;

  constructor({ theme, gridSize, selection = null, ...params }: GridParams) {
    super({
      style_class: `${theme}__tile-table`,
      can_focus: true,
      track_hover: true,
      reactive: true,
      layout_manager: new Clutter.GridLayout({
        row_homogeneous: true,
        column_homogeneous: true,
      }),
      ...params
    });

    this.#theme = theme;
    this.gridSize = gridSize;
    this.selection = selection;
    this.#hoverTile = null;
  }

  /**
   * The dimensions of the grid in terms of columns and rows.
   *
   * When updated, it resets any selection that might had existed.
   */
  set gridSize(gridSize: GridSize) {
    if (this.selection) {
      this.selection = null;
    }

    this.#gridSize = gridSize;
    this.destroy_all_children();
    this.#renderGrid();
    this.notify("grid-size");
  }

  get gridSize() {
    return this.#gridSize;
  }

  /**
   * The highlighted area of tiles in the grid, if any.
   */
  set selection(selection: GridSelection | null) {
    this.#selection = selection;

    this.#refreshGrid();
    this.notify("selection");
  }

  get selection() {
    return this.#selection;
  }

  /**
   * The 1x1 selection of the current hovered tile, if any.
   */
  get hoverTile(): GridOffset | null {
    return this.#hoverTile;
  }

  get #layoutManager() {
    return this.layout_manager as Clutter.GridLayout;
  }

  #renderGrid() {
    const tileWidth = this.width / this.gridSize.cols;
    const tileHeight = this.height / this.gridSize.rows;

    for (let col = 0; col < this.gridSize.cols; ++col) {
      for (let row = 0; row < this.gridSize.rows; ++row) {
        const tile = TextButton.new_styled({
          style_class: `${this.#theme}__tile-table-item`,
          width: tileWidth,
          height: tileHeight,
        });

        tile.connect("clicked", this.#onTileClick.bind(this, col, row));
        tile.connect("notify::hover", this.#onTileHover.bind(this, col, row));

        this.#layoutManager.attach(tile, col, row, 1, 1);
      }
    }
  }

  #refreshGrid() {
    const anchor = this.selection?.anchor ?? { col: -1, row: -1 };
    const { col: endCol, row: endRow } = this.selection?.target ?? anchor;
    const { col: startCol, row: startRow } = anchor;
    const colRange = [Math.min(startCol, endCol), Math.max(startCol, endCol)];
    const rowRange = [Math.min(startRow, endRow), Math.max(startRow, endRow)];

    for (let row = 0; row < this.gridSize.rows; ++row) {
      for (let col = 0; col < this.gridSize.cols; ++col) {
        const tile = this.#layoutManager.get_child_at(col, row) as TextButton;
        const isActive = (
          colRange[0] <= col && col <= colRange[1] &&
          rowRange[0] <= row && row <= rowRange[1]
        );

        if (tile.active !== isActive) {
          tile.active = isActive;
        }
      }
    }
  }

  #onTileClick(col: number, row: number) {
    const at: GridOffset = { col, row };

    // start selection
    if (!this.selection) {
      this.selection = { anchor: at, target: at };
      return;
    }

    // end selection
    this.selection = { anchor: this.selection.anchor, target: at };
    this.emit("selected");
    this.selection = null;
  }

  #onTileHover(col: number, row: number, tile: TextButton) {
    // no ongoing selection
    if (!this.selection) {
      tile.active = tile.hover;

      const isStale =
        this.#hoverTile?.col !== col ||
        this.#hoverTile?.row !== row;

      if (tile.hover && isStale) {
        this.#hoverTile = { col, row };
        this.notify("hover-tile");
      } else if (!tile.hover && !isStale) {
        this.#hoverTile = null;
        this.notify("hover-tile");
      }

      return;
    }

    // selection has changed
    // update internal state but to not notify about the change since there
    // is already a selection in progress which supersedes the hover.
    if (this.#hoverTile) {
      this.#hoverTile = null;
    }

    if (
      this.selection.target.col !== col ||
      this.selection.target.row !== row
    ) {
      this.selection = {
        anchor: this.selection.anchor,
        target: { col, row },
      };
    }
  }
});
