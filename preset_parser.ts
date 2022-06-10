import { XY, TileSpec, GridSize, TupleHolder, MAX_TUPLE_MEMBER_VALUE } from './tilespec'

/**
 * parsePreset parses a sequence of TileSpec objects from a string like "8x8 0:0
 * 0:7, 8x10 0:0 2:7" or "8x8 0:0 0:7, 0:0 2:7"
 *
 * The 8x8 and 8x10 values above are the "grid size." The grid size may be
 * omitted, then fallback grid size will be used.
 */
export function parsePreset(preset: string, fallback?: GridSize): Array<TileSpec> {
    const parts = preset.split(',').map(x => x.trim());

    let mostRecentSpec: TileSpec|null = null;
    return parts.map((part: string, index: number): TileSpec => {
        if (hasImpliedGridSize(part)) {
            if (mostRecentSpec === null) {
                if (fallback === undefined) {
                    throw new Error(`preset component[${index}] ${part} of ${preset} is missing grid size (e.g., '3x3') and no fallback is specified`);
                } else {
                    part = `${fallback.width}x${fallback.height} ${part}`;
                }
            } else {
                part = `${mostRecentSpec.gridWidth}x${mostRecentSpec.gridHeight} ${part}`;
            }
        }
        const parsed = parseSinglePreset(part);
        mostRecentSpec = parsed;
        return parsed;
    });
}

function parseSinglePreset(preset: string) {
    const ps = preset.trim().split(" ");
    if (ps.length != 3) {
        throw new Error(`Bad preset: ${JSON.stringify(preset)}`);
    }
    const gridFormat = parseTuple(ps[0], "x");
    let luc = new TupleHolder(ps[1]);
    let rdc = new TupleHolder(ps[2]);
    if    (gridFormat.x < 1 || gridFormat.x > 100 
        || gridFormat.y < 1 || gridFormat.y > 100) {
        throw new Error(`Bad preset: ${JSON.stringify(preset)} grid size out of range 1..100`);
    }    
    return new TileSpec(gridFormat.x, gridFormat.y, luc, rdc);
}

function hasImpliedGridSize(singlePreset: string): boolean {
    return singlePreset.trim().split(" ").length === 2;
}

/**
 * Parses a value like like 6x4 or 1:2 into {X: 6, Y: 4} or {X: 1, Y: 2}.
 */
function parseTuple(unparsed: string, delim: string) {
    // parsing grid size in unparsed XdelimY, like 6x4 or 1:2
    const gssk = unparsed.split(delim);

    if (gssk.length !== 2) {
        throw new Error("Failed to split " + unparsed + " by delimiter " + delim + " into two numbers");
    }
    const numbers = gssk.map(Number);
    if (numbers.some(n => isNaN(n) || n > MAX_TUPLE_MEMBER_VALUE)) {
        throw new Error(`All elements of tuple must be intgers in [-inf, ${MAX_TUPLE_MEMBER_VALUE}]: ${JSON.stringify(unparsed)}`)
    }

    return new XY(numbers[0], numbers[1]);
}
