import GLib from "gi://GLib";
import GObject from "gi://GObject";
import St from "gi://St";

import { GridOffset, GridSelection, GridSize } from "../types/grid.js";
import { Theme } from "../types/theme.js";
import { GarbageCollector } from "../util/gc.js";
import ButtonBar from "./overlay/ButtonBar.js";
import Container from "./overlay/Container.js";
import Grid from "./overlay/Grid.js";
import TextButton from "./overlay/TextButton.js";
import TitleBar from "./overlay/TitleBar.js";

const TABLE_WIDTH = 320;

type TextButton = ReturnType<typeof TextButton.new_themed>;

export interface OverlayParams extends Partial<St.BoxLayout.ConstructorProps> {
  theme: Theme;

  /**
   * Overlay title displayed next to the close button.
   */
  title: string;

  /**
   * The grid size presets. The overlay will initialize the grid with the first
   * preset in the list.
   */
  presets: GridSize[];

  /**
   * The grid aspect ratio (width/height).
   */
  gridAspectRatio: number;

  /**
   * Optional. The initial area of highlighted tiles in the grid.
   */
  gridSelection?: GridSelection | null;

  /**
   * Optional. Whether to animate the repositioning of the overlay.
   */
  animate?: boolean;

  /**
   * Optional. The time in milliseconds that a selection remains after the
   * cursor left the overlay.
   */
  selectionTimeout?: number;
}

/**
 * The gTile overlay user interface.
 *
 * The overlay consists of
 *   - a title bar with a close button and a window title
 *   - an interactive grid with user-defined dimensions
 *   - a list of preset buttons to change the grid dimension
 *   - a list of arbitrary action buttons
 *
 * The overlay is self-contained in that it orchestrates the components listed
 * above, i.e., it acts upon a click on the close button by closing itself and
 * it also updates the grid size when one of the preset buttons is clicked.
 * Parent components can use the regular GObject mechanisms, namely the
 * `notify::<prop-name>` signal, to get notified about these changes. The
 * `close` event is not directly exposed and instead the `visible` property can
 * be watched.
 *
 * The overlay forwards the GObject properties and signals from {@link Grid}.
 */
export default GObject.registerClass({
  GTypeName: "GTileOverlay",
  Properties: {
    animate: GObject.ParamSpec.boolean(
      "animate",
      "Animate",
      "Whether to anmiate UI position changes",
      GObject.ParamFlags.READWRITE,
      true,
    ),
    /**
     * Forwarded from {@link Grid}.
     */
    "grid-size": GObject.ParamSpec.jsobject(
      "grid-size",
      "Grid size",
      "The dimension of the grid in terms of columns and rows",
      GObject.ParamFlags.READWRITE,
    ),
    /**
     * Forwarded from {@link Grid}.
     */
    "grid-selection": GObject.ParamSpec.jsobject(
      "grid-selection",
      "Grid selection",
      "A rectangular tile selection within the grid",
      GObject.ParamFlags.READWRITE,
    ),
    /**
     * Forwarded from {@link Grid}.
     */
    "grid-hover-tile": GObject.ParamSpec.jsobject(
      "grid-hover-tile",
      "Grid hover tile",
      "The currently hovered tile in the grid, if any",
      GObject.ParamFlags.READABLE,
    ),
    "selection-timeout": GObject.ParamSpec.int(
      "selection-timeout",
      "Selection timeout",
      "Grace period before a selection is unset when the cursor loses focus.",
      GObject.ParamFlags.READWRITE,
      0, 5000, 200
    )
  },
  Signals: {
    /**
     * Forwarded from {@link Grid}.
     */
    selected: {},
  }
}, class extends St.BoxLayout implements GarbageCollector {
  #theme: Theme;
  #titleBar: InstanceType<typeof TitleBar>;
  #grid: InstanceType<typeof Grid>;
  #presetButtons: ReturnType<typeof ButtonBar.new_styled>;
  #actionButtons: ReturnType<typeof ButtonBar.new_styled>;
  #animate: boolean;
  #selectionTimeout: number;
  #delayTimeoutID: GLib.Source | null = null;

  constructor({
    theme,
    title,
    presets,
    gridAspectRatio,
    gridSelection = null,
    animate = true,
    selectionTimeout = 200,
    ...params
  }: OverlayParams) {
    super({
      style_class: theme,
      vertical: true,
      reactive: true,
      can_focus: true,
      track_hover: true,
      ...params,
    });

    // --- initialize ---
    this.#theme = theme;
    this.#titleBar = new TitleBar({ theme, title });
    this.#grid = new Grid({
      theme,
      gridSize: presets[0],
      selection: gridSelection,
      width: TABLE_WIDTH - 2,
      height: TABLE_WIDTH / gridAspectRatio,
    });
    this.#presetButtons = ButtonBar.new_styled({
      style_class: `${theme}__preset`,
      width: TABLE_WIDTH - 20,
    });
    this.#actionButtons = ButtonBar.new_styled({
      style_class: `${theme}__action`,
      width: TABLE_WIDTH - 20,
    });
    this.#animate = animate;
    this.#selectionTimeout = selectionTimeout;
    this.#delayTimeoutID = null;

    this.presets = presets;

    // --- show  UI ---
    this.add_child(Container.new_styled({
      style_class: `${theme}__title-container`,
      child: this.#titleBar,
    }));
    this.add_child(Container.new_styled({
      style_class: `${theme}__tile-container`,
      child: this.#grid
    }));
    this.add_child(Container.new_styled({
      style_class: `${theme}__preset-container`,
      child: this.#presetButtons
    }));
    this.add_child(Container.new_styled({
      style_class: `${theme}__action-container`,
      child: this.#actionButtons
    }));

    // --- event handlers ---
    this.#titleBar.connect("closed", () => { this.visible = false; })
    this.#grid.connect("notify::grid-size", () => {
      this.#onGridSizeChanged();
      this.notify("grid-size");
    });
    this.#grid.connect("notify::selection", () =>
      this.notify("grid-selection"));
    this.#grid.connect("notify::hover-tile", () =>
      this.notify("grid-hover-tile"));
    this.#grid.connect("selected", () => this.emit("selected"));
    this.connect("notify::visible", () => { this.gridSelection = null; });
    this.connect("notify::hover", this.#onHoverChanged.bind(this));
  }

  release(): void {
    if (this.#delayTimeoutID) {
      clearTimeout(this.#delayTimeoutID);
      this.#delayTimeoutID = null;
    }
  }

  /**
   * Overlay title displayed next to the close button.
   */
  set title(title: string) {
    this.#titleBar.title = title;
  }

  get title() {
    return this.#titleBar.title;
  }

  /**
   * Dimensions of the grid. When set, any ongoing selection (if any) is reset.
   */
  set gridSize(gridSize: GridSize) {
    this.#grid.gridSize = gridSize;
  }

  get gridSize() {
    return this.#grid.gridSize;
  }

  /**
   * Area of highlighted tiles in the grid.
   */
  set gridSelection(gridSelection: GridSelection | null) {
    this.#grid.selection = gridSelection;
  }

  get gridSelection() {
    return this.#grid.selection;
  }

  /**
   * Whether to animate changes in position of the the overlay.
   */
  set animate(animate: boolean) {
    this.#animate = animate;
  }

  get animate() {
    return this.#animate;
  }

  /**
   * The time in milliseconds that a selection remains after the cursor left the
   * overlay.
   */
  set selectionTimeout(timeout: number) {
    this.#selectionTimeout = timeout;
    this.notify("selection-timeout");
  }

  get selectionTimeout() {
    return this.#selectionTimeout;
  }

  /**
   * The offset of the current hovered tile in the grid, if any.
   */
  get gridHoverTile(): GridOffset | null {
    return this.#grid.hoverTile;
  }

  /**
   * Can be applied to the X-coordinate of the anchor point at which the overlay
   * should be displayed. This centers the overlay on the X axis.
   */
  get popupOffsetX(): number {
    return -(this.width / 2);
  }

  /**
   * Can be applied to the Y-coordinate of the anchor point at which the overlay
   * should be displayed. This places the anchor in the center of the grid.
   */
  get popupOffsetY(): number {
    return -(this.#titleBar.get_parent()!.height / 2);
  }

  /**
   * The available grid size presets.
   *
   * An update of presets will
   *   - reset the grid selection, if any
   *   - reset the grid size to the first preset in the list, unless the list
   *     contains a preset that matches the currently selected grid size
   */
  set presets(presets: GridSize[]) {
    this.#presetButtons.removeButtons();

    const { cols, rows } = this.gridSize;
    for (const preset of presets) {
      const isPresetActive = preset.cols === cols && preset.rows === rows;
      const button = TextButton.new_themed({
        theme: this.#theme,
        active: isPresetActive,
        label: `${preset.cols}x${preset.rows}`,
      });

      this.#presetButtons.addButton(button);
      button.connect("clicked", () => { this.#grid.gridSize = preset; });
    }
  }

  /**
   * Animated repositioning of the overlay to the given anchor.
   *
   * @param x The x coordinate of the actor in pixels.
   * @param y The y coordinate of the actor in pixels.
   */
  placeAt(x: number, y: number) {
    // Use default easing (AnimationMode.EASE_OUT_QUAD with 250ms duration)
    this.animate && this.save_easing_state();
    this.x = x;
    this.y = y;
    this.animate && this.restore_easing_state();
  }

  /**
   * Rotates (by one iteration at a time) through the grid {@link presets}.
   */
  iteratePreset() {
    const textButtons = this.#presetButtons.get_children() as TextButton[];
    const { cols: currentCols, rows: currentRows } = this.gridSize;
    let activateNext = false;

    for (const button of [...textButtons, textButtons[0]]) {
      const [cols, rows] = button.label!.split("x").map(n => Number(n));

      if (activateNext) {
        this.gridSize = { cols, rows };
        return;
      } else if (cols === currentCols && rows === currentRows) {
        activateNext = true;
      }
    }
  }

  /**
   * Adds a new element to the action button bar.
   *
   * @param button The button to be added.
   */
  addActionButton(button: St.Button) {
    this.#actionButtons.addButton(button);
  }

  #onGridSizeChanged() {
    const textButtons = this.#presetButtons.get_children() as TextButton[];
    const { cols, rows } = this.gridSize;

    for (const button of textButtons) {
      button.active = button.label === `${cols}x${rows}`;
    }
  }

  #onHoverChanged() {
    if (this.#delayTimeoutID) {
      clearTimeout(this.#delayTimeoutID);
      this.#delayTimeoutID = null;
    }

    if (!this.hover && this.#grid.selection) {
      this.#delayTimeoutID = setTimeout(() => {
        this.#grid.selection = null;
      }, this.#selectionTimeout);
    }
  }
});
