import { GridOffset, GridSelection, GridSize } from "../types/grid.js";
import { CardinalDirection } from "../types/hotkeys.js";

export const DefaultGridSizes: GridSize[] = [
  { cols: 8, rows: 6 },
  { cols: 6, rows: 4 },
  { cols: 4, rows: 4 },
];

/**
 * Parses a user-specified string which represents a list of grid sizes.
 *
 * A grid size is specified by a string of the format `<cols>x<rows>`. Multiple
 * grid sizes may be specified by separating them with a comma.
 *
 * @param config The user-specified config value, e.g. `3x3, 4x5, 5x10`.
 * @param fallback Returned when parsining an invalid or empty list.
 * @returns {GridSize[]}
 */
export function parseGridSizesConfig(
  config: string | null,
  fallback = DefaultGridSizes,
): GridSize[] {
  const sizes = (config ?? "").
    split(",").
    map(sizeSpec => sizeSpec.trim().split(/x/i).map(Number)).
    filter(([a, b]) => !isNaN(a) && !isNaN(b));

  if (
    sizes.length > 0 &&
    sizes.every(pair => pair.length === 2)
  ) {
    // Constrain grid size to sane limits
    return sizes.map(([cols, rows]) => ({
      cols: Math.clamp(cols, 1, 64),
      rows: Math.clamp(rows, 1, 64),
    }));
  }

  return fallback;
}

/**
 * Moves a {@link selection} towards a {@link dir|direction} within the
 * specified {@link bounds|boundary}.
 *
 * @param selection The selection to be panned.
 * @param bounds The grid boundaries within the selection can be panned.
 * @param dir The cardinal direction in which to move the selection.
 * @returns The new selection after performing the pan operation.
 */
export function pan (
  selection: GridSelection,
  bounds: GridSize,
  dir: CardinalDirection,
): GridSelection {
  const
    colOffset = dir === "east"  ? 1 : dir === "west"  ? -1 : 0,
    rowOffset = dir === "south" ? 1 : dir === "north" ? -1 : 0,
    maxCol = bounds.cols - 1,
    maxRow = bounds.rows - 1,
    anchorCol = Math.clamp(selection.anchor.col + colOffset, 0, maxCol),
    anchorRow = Math.clamp(selection.anchor.row + rowOffset, 0, maxRow),
    targetCol = Math.clamp(selection.target.col + colOffset, 0, maxCol),
    targetRow = Math.clamp(selection.target.row + rowOffset, 0, maxRow);

  return {
    anchor: { col: anchorCol, row: anchorRow },
    target: { col: targetCol, row: targetRow },
  };
}

/**
 * Adjusts a {@link selection} by shrinking or extending it (see {@link mode})
 * by one tile towards a {@link dir|direction} and within the specified
 * {@link bounds|boundaries}.
 *
 * @param selection The selection to be adjusted.
 * @param bounds The grid boundaries that the selection must not exceed.
 * @param dir The edge of the selection that shall be shrinked or extended.
 * @param mode Whether to shrink or extend the selection.
 */
export function adjust(
  selection: GridSelection,
  bounds: GridSize,
  dir: CardinalDirection,
  mode: "extend" | "shrink"
): GridSelection {
  const nw: GridOffset = {
    col: Math.min(selection.anchor.col, selection.target.col),
    row: Math.min(selection.anchor.row, selection.target.row),
  };
  const se: GridOffset = {
    col: Math.max(selection.anchor.col, selection.target.col),
    row: Math.max(selection.anchor.row, selection.target.row),
  };

  const rel = (dir === "north" || dir === "west") ? -1 : 1;
  const anchor = mode === "extend" ? nw : se;
  const target = mode === "extend" ? se : nw;
  switch (dir) {
    case "north":
      anchor.row = Math.clamp(anchor.row + rel, 0, bounds.rows - 1);
      break;
    case "east":
      target.col = Math.clamp(target.col + rel, 0, bounds.cols - 1);
      break;
    case "south":
      target.row = Math.clamp(target.row + rel, 0, bounds.rows - 1);
      break;
    case "west":
      anchor.col = Math.clamp(anchor.col + rel, 0, bounds.cols - 1);
      break;
  }

  return { anchor, target };
}
