/**
 * Represents a margin with the specified relative thickness.
 *
 * For instance, the following inset represents a margin of width 10 on a screen
 * with a resolution of 100x100 (pixel).
 * - `{ top: .1, right: .1, bottom: .1, left: .1 }`
 */
export interface Inset {
  top: number;
  right: number;
  bottom: number;
  left: number;
}


/**
 * Data structure that represents an area on a 2D plane.
 *
 * The {@link x} and {@link y} coordinates identify the north-west corner of the
 * rectangle, assuming that the origin of the plane is also in the north-west
 * corner and has coordinates (0, 0).
 */
export interface Rectangle {
  x: number
  y: number
  width: number
  height: number
}

/**
 * The dimensions of a grid in terms of columns and rows.
 */
export interface GridSize {
  cols: number;
  rows: number;
}

/**
 * Represents a location inside a grid. The north-west corner of the grid is
 * considered the origin of the grid with an offset of (0, 0).
 */
export interface GridOffset {
  col: number;
  row: number;
}

/**
 * Represents a rectangular selection inside a grid.
 *
 * {@link GridSelection.anchor} represents the origin of a selection and
 * {@link GridSelection.target} represents the ending point of a selection.
 *
 * Unless explicitly stated otherwise, selections are not normalized and can be
 * ambiguous. For instance, the following selections are all semantically
 * equivalent:
 *
 *   - `{ anchor: { col: 2, row: 1 }, target: { col: 3, row: 2 }}`
 *   - `{ anchor: { col: 3, row: 1 }, target: { col: 2, row: 2 }}`
 *   - `{ anchor: { col: 2, row: 2 }, target: { col: 3, row: 1 }}`
 *   - `{ anchor: { col: 3, row: 2 }, target: { col: 2, row: 1 }}`
 *
 * They all represent the following selection (`#`) inside a grid (`*`):
 * ```
 *   ******
 *   **##**
 *   **##**
 *   ******
 * ```
 */
export interface GridSelection {
  anchor: GridOffset;
  target: GridOffset;
}
