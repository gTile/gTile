import Clutter from "gi://Clutter";
import GObject from "gi://GObject";
import St from "gi://St";

import { GridOffset, GridSize, GridSelection } from "../../types/grid.js";
import TextButton from "./TextButton.js";

type TextButton = ReturnType<typeof TextButton.new_styled>;

const AspectRatioGridLayout = GObject.registerClass({
  GTypeName: "GTileAspectRatioGridLayout",
  Properties: {
    "aspect-ratio": GObject.ParamSpec.double(
      "aspect-ratio", "Aspect ratio", "Width / height ratio",
      GObject.ParamFlags.READWRITE, 0.01, 100, 1,
    ),
    "cols": GObject.ParamSpec.int(
      "cols", "Cols", "Number of columns",
      GObject.ParamFlags.READWRITE, 1, 100, 1,
    ),
    "rows": GObject.ParamSpec.int(
      "rows", "Rows", "Number of rows",
      GObject.ParamFlags.READWRITE, 1, 100, 1,
    ),
  },
}, class extends Clutter.LayoutManager {
  "aspect-ratio": number = 1;
  cols: number = 1;
  rows: number = 1;

  vfunc_get_preferred_width(_container: Clutter.Actor, _for_height: number): [number, number] {
    return [0, 0];
  }

  vfunc_get_preferred_height(container: Clutter.Actor, for_width: number): [number, number] {
    const w = for_width > 0 ? for_width : container.width;
    const h = w / this["aspect-ratio"];
    return [h, h];
  }

  vfunc_allocate(container: Clutter.Actor, box: Clutter.ActorBox): void {
    const tileW = (box.x2 - box.x1) / this.cols;
    const tileH = (box.y2 - box.y1) / this.rows;

    let index = 0;
    for (const child of container.get_children()) {
      const col = index % this.cols;
      const row = Math.floor(index / this.cols);
      const childBox = new Clutter.ActorBox();
      childBox.x1 = col * tileW;
      childBox.y1 = row * tileH;
      childBox.x2 = childBox.x1 + tileW;
      childBox.y2 = childBox.y1 + tileH;
      child.allocate(childBox);
      index++;
    }
  }
});

export interface GridParams extends Partial<St.Widget.ConstructorProps> {
  /**
   * The dimensions of the grid in terms of columns and rows.
   */
  gridSize: GridSize;

  /**
   * Width / height aspect ratio of the grid. Used to compute the natural
   * height from the allocated width, keeping tiles square.
   */
  aspectRatio: number;

  /**
   * Optional. The initial area of highlighted tiles in the grid.
   */
  selection?: GridSelection | null;
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
  #gridSize!: GridSize;
  #selection!: GridSelection | null;
  #hoverTile: GridOffset | null;

  constructor({ gridSize, aspectRatio, selection = null, ...params }: GridParams) {
    const layoutManager = new AspectRatioGridLayout();
    layoutManager["aspect-ratio"] = aspectRatio;

    super({
      style_class: `gtile-tile-table`,
      can_focus: true,
      track_hover: true,
      reactive: true,
      layout_manager: layoutManager,
      ...params
    });

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
    return this.layout_manager as InstanceType<typeof AspectRatioGridLayout>;
  }

  #renderGrid() {
    this.#layoutManager.cols = this.gridSize.cols;
    this.#layoutManager.rows = this.gridSize.rows;

    for (let row = 0; row < this.gridSize.rows; ++row) {
      for (let col = 0; col < this.gridSize.cols; ++col) {
        const tile = TextButton.new_styled({
          style_class: `gtile-tile-table-item`,
        });

        tile.connect("clicked", this.#onTileClick.bind(this, col, row));
        tile.connect("notify::hover", this.#onTileHover.bind(this, col, row));

        this.add_child(tile);
      }
    }
  }

  #refreshGrid() {
    const anchor = this.selection?.anchor ?? { col: -1, row: -1 };
    const { col: endCol, row: endRow } = this.selection?.target ?? anchor;
    const { col: startCol, row: startRow } = anchor;
    const colRange = [Math.min(startCol, endCol), Math.max(startCol, endCol)];
    const rowRange = [Math.min(startRow, endRow), Math.max(startRow, endRow)];

    let index = 0;
    for (const child of this.get_children()) {
      const tile = child as TextButton;
      const col = index % this.gridSize.cols;
      const row = Math.floor(index / this.gridSize.cols);
      const isActive = (
        colRange[0] <= col && col <= colRange[1] &&
        rowRange[0] <= row && row <= rowRange[1]
      );

      if (tile.active !== isActive) {
        tile.active = isActive;
      }
      index++;
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
