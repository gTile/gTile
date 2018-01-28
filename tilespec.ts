/**
 * TileSpec represents a rectangular area on display by means of specifying a
 * number of evenly spaced tiles and two corners.
 *
 * The syntax
 */
class TileSpec {
    gridWidth: number;
    gridHeight: number;
    luc: XY;
    rdc: XY;

    constructor(gridWidth: number, gridHeight: number, luc: XY, rdc: XY) {
        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;
        this.luc = luc;
        this.rdc = rdc;
    }

    toString() {
        return [[this.gridWidth, this.gridHeight].join('x'),
                [this.luc.x, this.luc.y].join(':'),
                [this.rdc.x, this.rdc.y].join(':')].join(' ');
    }

    toFrameRect(workArea: Rect, margin: Size) {
        const elemSize = new Size(
            Math.floor(workArea.size.width / this.gridWidth),
            Math.floor(workArea.size.height / this.gridHeight));
        return new Rect(
            new XY(
                workArea.origin.x + margin.width + this.luc.x * elemSize.width,
                workArea.origin.y + margin.height + this.luc.y * elemSize.height),
            new Size((this.rdc.x + 1 - this.luc.x) * elemSize.width - 2 * margin.width,
                     (this.rdc.y + 1 - this.luc.y) * elemSize.height- 2 * margin.height));
    }
}

class XY {
    x: number;
    y: number;
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    toString() {
        return 'XY(' + [this.x, this.y].join(', ') + ')';
    }
}

class Size {
    width: number;
    height: number;
    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
    }

    toString() {
        return [this.width, this.height].join('x')
    }
}

/**
 * A screen rectangle. A (0, 0) origin represents the top left of a display
 * area. Units are typically pixels.
 */
class Rect {
    origin: XY;
    size: Size;
    constructor(origin: XY, size: Size) {
        this.origin = origin;
        this.size = size;
    }

    toString() {
        return [this.origin, this.size].join(' ');
    }

    equal(r: Rect) {
        return (this.origin.x === r.origin.x &&
                this.origin.y === r.origin.y &&
                this.size.width === r.size.width &&
                this.size.height === r.size.height);
    }
}

/** parsePreset parses a string like "8x8 0:0 0:7, 8x8 0:0 2:7" */
function parsePreset(preset: string) {
    return preset.split(",")
        .map(x => x.trim())
        .map(parseSinglePreset);
}

function parseSinglePreset(preset: string) {
    const ps = preset.trim().split(" ");
    if(ps.length != 3) {
        throw new Error("Bad preset: " + preset);
    }
    const gridFormat = parseTuple(ps[0], "x");
    const luc = parseTuple(ps[1], ":");
    const rdc = parseTuple(ps[2], ":");

    if  (  gridFormat.x < 1 || luc.x < 0 || rdc.x < 0
        || gridFormat.y < 1 || luc.y < 0 || rdc.y < 0
        || gridFormat.x <= luc.x || gridFormat.x <= rdc.x
        || gridFormat.y <= luc.y || gridFormat.y <= rdc.y
        || luc.x > rdc.x || luc.y > rdc.y) {
        throw new Error("Bad preset: " + preset);
    }
    return new TileSpec(gridFormat.x, gridFormat.y, luc, rdc);
}

function parseTuple(unparsed: string, delim: string) {
    // parsing grid size in unparsed XdelimY, like 6x4 or 1:2
    const gssk = unparsed.split(delim);

    if(gssk.length != 2) {
        throw new Error("Failed to split " + unparsed + " by delimiter " + delim + " into two numbers");
    }
    const numbers = gssk.map(Number);
    if (numbers.some(n => isNaN(n) || n < 0 || n > 40)) {
        throw new Error("All elements of tuple must be intgers in [0, 40] : " + unparsed)
    }
    return new XY(numbers[0], numbers[1]);
}
