/**
 * TileSpec represents a rectangular area on display by means of specifying a
 * number of evenly spaced tiles and two corners.
 *
 * The syntax
 */
class TileSpec {
    rows: Number;
    cols: Number
    luc: XY;
    rdc: XY;

    //    constructor(x: Number, y: Number, lucX: Number, lucY: Number, rdcX: Number, rdcY: Number) {
    constructor(rows: Number, cols: Number, luc, rdc: XY) {
        this.rows = rows
        this.cols = cols;
        this.luc = luc;
        this.rdc = rdc;
    }
}

class XY {
    x: Number;
    y: Number;
    constructor(x, y: Number) {
        this.x, this.y = x, y;
    }
}

/** parsePreset parses a string like "0x0" */
function parsePreset(preset: string) {
    const ps = preset.split(" ");
    if(ps.length != 3) {
        throw new Error("Bad preset: " + preset);
    }
    const grid_format = parseTuple(ps[0], "x");
    const luc = parseTuple(ps[1], ":");
    const rdc = parseTuple(ps[2], ":");

    //log("Parsed " + grid_format.x + "x" + grid_format.y + " "
        //+ luc.x + ":" + luc.y + " " + rdc.x + ":" + rdc.y);
    if  (  grid_format.x < 1 || luc.x < 0 || rdc.x < 0
        || grid_format.y < 1 || luc.y < 0 || rdc.y < 0
        || grid_format.x <= luc.x || grid_format.x <= rdc.x
        || grid_format.y <= luc.y || grid_format.y <= rdc.y
        || luc.x > rdc.x || luc.y > rdc.y) {
        throw new Error("Bad preset: " + preset);
    }
    return new TileSpec(grid_format.x, grid_format.y, luc, rdc);
}

function parseTuple(format, delimiter) {
    // parsing grid size in format XdelimY, like 6x4 or 1:2
    let gssk = format.split(delimiter);
    if(gssk.length != 2
        || isNaN(gssk[0]) || gssk[0] < 0 || gssk[0] > 40
        || isNaN(gssk[1]) || gssk[1] < 0 || gssk[1] > 40) {
        throw new Error("Bad format " + format + ", delimiter " + delimiter);
    }
    return new XY(Number(gssk[0]), Number(gssk[1]));
}
