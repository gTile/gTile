import { GridSize } from "../types/grid.js";

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
    map(sizeSpec => sizeSpec.trim().split(/x/i).map(Number));

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
