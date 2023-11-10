import { GridOffset, GridSelection, GridSize } from "../types/grid.js";
import { AutoTileAction, CardinalDirection } from "../types/hotkeys.js";
import { GridSpecParser } from "./parser.js";

export const DefaultGridSizes: GridSize[] = [
  { cols: 8, rows: 6 },
  { cols: 6, rows: 4 },
  { cols: 4, rows: 4 },
];

export const AutoTileLayouts = {
  "main": new GridSpecParser("cols(2, 2d)").parse()!,
  "main-inverted": new GridSpecParser("cols(2d, 2)").parse()!,
  "cols": {
    1: new GridSpecParser(`cols(1d)`).parse()!,
    2: new GridSpecParser(`cols(2d,2d)`).parse()!,
    3: new GridSpecParser(`cols(3d,3d,3d)`).parse()!,
    4: new GridSpecParser(`cols(4d,4d,4d,4d)`).parse()!,
    5: new GridSpecParser(`cols(5d,5d,5d,5d,5d)`).parse()!,
    6: new GridSpecParser(`cols(6d,6d,6d,6d,6d,6d)`).parse()!,
    7: new GridSpecParser(`cols(7d,7d,7d,7d,7d,7d,7d)`).parse()!,
    8: new GridSpecParser(`cols(8d,8d,8d,8d,8d,8d,8d,8d)`).parse()!,
    9: new GridSpecParser(`cols(9d,9d,9d,9d,9d,9d,9d,9d,9d)`).parse()!,
    10: new GridSpecParser(`cols(1d,1d,1d,1d,1d,1d,1d,1d,1d,1d)`).parse()!,
  },
} as const satisfies Record<AutoTileAction["layout"], any>;

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
 * @returns The adjusted selection with a NW anchor and SE target.
 */
export function adjust(
  selection: GridSelection,
  bounds: GridSize,
  dir: CardinalDirection,
  mode: "extend" | "shrink"
): GridSelection {
  const anchor: GridOffset = {
    col: Math.min(selection.anchor.col, selection.target.col),
    row: Math.min(selection.anchor.row, selection.target.row),
  };
  const target: GridOffset = {
    col: Math.max(selection.anchor.col, selection.target.col),
    row: Math.max(selection.anchor.row, selection.target.row),
  };

  const rel =
    dir === "north" && mode === "shrink" ? 1 :
    dir === "east"  && mode === "extend" ? 1 :
    dir === "south" && mode === "extend" ? 1 :
    dir === "west"  && mode === "shrink" ? 1 :
    -1;

  switch (dir) {
    case "north":
      anchor.row = Math.clamp(anchor.row + rel, 0, target.row);
      break;
    case "east":
      target.col = Math.clamp(target.col + rel, anchor.col, bounds.cols - 1);
      break;
    case "south":
      target.row = Math.clamp(target.row + rel, anchor.row, bounds.rows - 1);
      break;
    case "west":
      anchor.col = Math.clamp(anchor.col + rel, 0, target.col);
      break;
  }

  return { anchor, target };
}