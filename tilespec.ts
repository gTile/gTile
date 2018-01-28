/**
 * TileSpec represents a rectangular area on display by means of specifying a
 * number of evenly spaced tiles and two corners.
 *
 * The syntax
 */
export class TileSpec {
    x: Number;
    y: Number;
    lucX: Number;
    lucY: Number;
    rdcX: Number;
    rdcY: Number;
}

/** parsePreset parses a string like "0x0" */
export function parsePreset(preset: string) {
    const ps = preset.split(" ");
    if(ps.length != 3) {
        throw new Error("Bad preset: " + preset);
    }
    const grid_format = parseTuple(ps[0], "x");
    const luc = parseTuple(ps[1], ":");
    const rdc = parseTuple(ps[2], ":");

    //log("Parsed " + grid_format.X + "x" + grid_format.Y + " "
        //+ luc.X + ":" + luc.Y + " " + rdc.X + ":" + rdc.Y);
    if  (  grid_format.X < 1 || luc.X < 0 || rdc.X < 0
        || grid_format.Y < 1 || luc.Y < 0 || rdc.Y < 0
        || grid_format.X <= luc.X || grid_format.X <= rdc.X
        || grid_format.Y <= luc.Y || grid_format.Y <= rdc.Y
        || luc.X > rdc.X || luc.Y > rdc.Y) {
        throw new Error("Bad preset: " + preset);
    }
    const result = new TileSpec();
    result.x = parseInt('10');
    return result;
}

function parseTuple(format, delimiter) {
    // parsing grid size in format XdelimY, like 6x4 or 1:2
    let gssk = format.split(delimiter);
    if(gssk.length != 2
        || isNaN(gssk[0]) || gssk[0] < 0 || gssk[0] > 40
        || isNaN(gssk[1]) || gssk[1] < 0 || gssk[1] > 40) {
        throw new Error("Bad format " + format + ", delimiter " + delimiter);
    }
    //log("Parsed format " + gssk[0] + delimiter + gssk[1]);
    return {X: Number(gssk[0]), Y: Number(gssk[1]) };
}
