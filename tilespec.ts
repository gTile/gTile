/**
 * TileSpec represents a rectangular area on display by means of specifying a
 * number of evenly spaced tiles and two corners.
 */
export class TileSpec {
    readonly gridWidth: number;
    readonly gridHeight: number;
    readonly luc: TupleHolder;
    readonly rdc: TupleHolder;

    constructor(gridWidth: number, gridHeight: number, luc: TupleHolder, rdc: TupleHolder) {
        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;
        this.luc = luc;
        this.rdc = rdc;
    }

    toString(): string {
        return `${[this.gridWidth, this.gridHeight].join('x')} ${this.luc.toString()} ${this.rdc.toString}`;
    }

    toFrameRect(workArea: Rect): Rect {
        const elemSize = new Size(
            workArea.size.width / this.gridWidth,
            workArea.size.height / this.gridHeight);

        let left;
        let top;
        let right;
        let bottom;

        if (this.luc.types.x == 'tile') {
            const positiveTileNumber = this._convertNegativeCoord(this.gridWidth, this.luc.xy.x);
            left = Math.round(workArea.origin.x + (positiveTileNumber - 1) * elemSize.width);
        } else if (this.luc.types.x == 'approx_percentage') {
            const snappedToGrid = Math.round(this.gridWidth * this.luc.xy.x);
            left = Math.round(workArea.origin.x + snappedToGrid * elemSize.width);
        } else {
            left = Math.round(workArea.origin.x + workArea.size.width * this.luc.xy.x);
        }

        if (this.luc.types.y == 'tile') {
            const positiveTileNumber = this._convertNegativeCoord(this.gridHeight, this.luc.xy.y);
            top = Math.round(workArea.origin.y + (positiveTileNumber - 1) * elemSize.height);
        } else if (this.luc.types.y == 'approx_percentage') {
            const snappedToGrid = Math.round(this.gridHeight * this.luc.xy.y);
            top = Math.round(workArea.origin.y + snappedToGrid * elemSize.height);
        } else {
            top = Math.round(workArea.origin.y + workArea.size.height * this.luc.xy.y);
        }

        if (this.rdc.types.x == 'tile') {
            const positiveTileNumber = this._convertNegativeCoord(this.gridWidth, this.rdc.xy.x);
            right = Math.round(workArea.origin.x + positiveTileNumber * elemSize.width);
        } else if (this.rdc.types.x == 'approx_percentage') {
            const snappedToGrid = Math.round(this.gridWidth * this.rdc.xy.x);
            right= Math.round(workArea.origin.x + snappedToGrid * elemSize.width);
        } else {
            right = Math.round(workArea.origin.x + workArea.size.width * this.rdc.xy.x);
        }

        if (this.rdc.types.y == 'tile') {
            const positiveTileNumber = this._convertNegativeCoord(this.gridHeight, this.rdc.xy.y);
            bottom = Math.round(workArea.origin.y + positiveTileNumber * elemSize.height);
        } else if (this.rdc.types.y == 'approx_percentage') {
            const snappedToGrid = Math.round(this.gridHeight * this.rdc.xy.y);
            bottom = Math.round(workArea.origin.y + snappedToGrid * elemSize.height);
        } else {
            bottom = Math.round(workArea.origin.y + workArea.size.height * this.rdc.xy.y);
        }

        return new Rect(
            new XY(left, top),
            new Size(right - left - 1, bottom - top - 1)
        );
    }

    get gridSize(): GridSize {
        return new GridSize(this.gridWidth, this.gridHeight);
    }

    isFullscreen(workArea: Rect): boolean {
        return this.toFrameRect(workArea).equal(workArea, 1);
    }

    /**
     * Converts negative coordinates (e.g. -1:-1) to a positive format on a specified grid.
     * If x or y is a positive number, it is ignored.
     * E.g. -1:-1 on a 3:3 grid is a 3:3, as well as -1:3.
     */
    _convertNegativeCoord(gridEdges: number, coord: number) {
        if (coord < 0) {
            return gridEdges + coord + 1;
        } else {
            return coord;
        }
    }
}

export const MAX_TUPLE_MEMBER_VALUE = Number.MAX_SAFE_INTEGER;

/**
 * Tuple Holder represents a single starting or ending point (x and y coordinates),
 * as well as the type of the coordinate - "tile", "approx_percentage" or "percentage" now.
 *
 * E.g. ~0.75:0.75 is {X:0.75,Y:0.75}, types - 'percentage' & 'percentage'
 * approximate - true.
 */
export class TupleHolder {
    raw: string;
    xy: XY;
    types: CoordinateTypesHolder;

    constructor(raw: string) {
        this.raw = raw;

        const gssk = this.raw.split(':');

        this._validateTuple(gssk);

        this.xy = this._parseTuple(gssk);
        this.types = this._parseTypes(gssk);
    }

    toString() {
        return this.raw;
    }

    _parseTuple(tuple: Array<string>) {
        const x = this._parseCoordinate(tuple[0]);
        const y = this._parseCoordinate(tuple[1]);

        return new XY(x, y);
    }

    _parseTypes(tuple: Array<string>) {
        const typeX = this._parseType(tuple[0]);
        const typeY = this._parseType(tuple[1]);

        return new CoordinateTypesHolder(typeX, typeY);
    }

    _parseCoordinate(coord: string) {
        return Number(coord.replace('~', ''));
    }

    _parseType(coord: string) {
        if (coord.includes('~')) {
            return 'approx_percentage';
        } else if (coord.includes('.')) {
            return 'percentage';
        } else {
            return 'tile';
        }
    }

    _validateTuple(gssk: Array<string>) {
        if (gssk.length !== 2) {
            throw new Error(`Failed to split ${this.raw} into two numbers`);
        }

        this._validateCoordinate(gssk[0]);
        this._validateCoordinate(gssk[1]);
    }

    /**
     * Allowed values:
     * 1.0 (exact match)
     * Any float from 0.0 till 0.999..., with or without preceding approx indicator (~)
     * Any positive or negative integer, except 0
     */
    _validateCoordinate(coord: string) {
        const testRegex = /(~?0\.[0-9]+|1\.0|-?[1-9]+[0-9]*)/;

        if (!testRegex.test(coord)) {
            throw new Error(`Failed to parse ${coord} in tuple ${this.raw}`);
        }
    }
}

/**
 * Holds coordinate types for the tuple.
 * Currently 3 types are supported - tile, approx_percentage and percentage.
 */
export class CoordinateTypesHolder {
    x:CoordinateType
    y:CoordinateType

    constructor(x: CoordinateType, y: CoordinateType) {
        this.x = x;
        this.y = y;
    }
}

/**
 * Tile represents a tile number (integer from 1 till infinity).
 * Percentage represents a percentage of the screen (float'y syntax: 0.75 represents 75% of the display).
 * Approx percentage represents a the same percentage, but will be snapped to the currently set grid size.
*/
type CoordinateType = (
    "tile" |
    "percentage" |
    "approx_percentage"
);

export class GridSize {
    constructor(
        // Number of columns.
        readonly width: number,
        // Number of rows.
        readonly height: number) {}
    
    toString(): string {
        return `${this.width}x${this.height}`;
    }

    equals(other: GridSize): boolean {
        return this.width === other.width && this.height == other.height;
    }
}


export function parseGridSizesIgnoringErrors(s: string): GridSize[] {
    return s.split(',').flatMap(
        (part: string) => {
            const size = parseGridSizeIgnoringErrors(part.trim());
            return size ? [size] : [];
        });
}

function parseGridSizeIgnoringErrors(s: string): GridSize|null {
    const parts = s.split("x").map(Number);
    if (parts.length !== 2 || !parts.every(x => !isNaN(x))) {
        return null;
    }
    return new GridSize(parts[0], parts[1]);
}

export class XY {
    x:number
    y:number

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    clone() {
        return new XY(this.x, this.y);
    }

    toString() {
        return 'XY(' + [this.x, this.y].join(', ') + ')';
    }

    dot(b: XY) {
        return this.x * b.x + this.y * b.y;
    }

    unit() {
        const norm = this.l2norm()
        return new XY(this.x / norm, this.y / norm);
    }

    l2norm() {
        return Math.sqrt(this.l2normSquared());
    }

    l2normSquared() {
        return this.dot(this);
    }

    scale(s: number) {
        return new XY(this.x * s, this.y * s)
    }

    project(b: XY): XY {
        return b.scale(
            this.dot(b) / b.l2normSquared());
    }

    scalarProjection(b: XY): number {
        return this.dot(b.unit())
    }

    minus(b: XY) {
        return new XY(this.x - b.x, this.y - b.y)
    }

    plus(b: XY) {
        return new XY(this.x + b.x, this.y + b.y)
    }
}

const ADJOIN_DOT_PRODUCT_TOL = .02;

export class LineSegment {
    private constructor(readonly a: XY, readonly b: XY) { }

    static fromTwoPoints(a: XY, b: XY): LineSegment {
        return new LineSegment(a, b);
    }

    direction() {
        return this.b.minus(this.a).unit()
    }

    adjoins(other: LineSegment, distTol: number) {
        return this.parallels(other) && this.lineDistance(other) < distTol
    }

    parallels(other: LineSegment) {
        const unitDot = this.direction().dot(other.direction());
        return withinTol(Math.abs(unitDot), 1, ADJOIN_DOT_PRODUCT_TOL);
    }

    // The distance between the lines of two line segments. If lines are not
    // (close to) parallel, 0 is returned
    lineDistance(other: LineSegment) {
        return this.perpVectorBetweenLines(other).l2norm();
    }

    // The perpendicular vector between the lines of two line segments. If lines
    // are not (close to) parallel, [0, 0] is returned
    perpVectorBetweenLines(other: LineSegment) {
        const otherDir = other.direction();
        const unitDot = this.direction().dot(otherDir);
        if (!withinTol(Math.abs(unitDot), 1, ADJOIN_DOT_PRODUCT_TOL)) {
            return new XY(0, 0);
        }
        // Basically parallel. Now measure the perpendicular distance between
        // this.a->other.a and other.a->other.b.
        const d = other.a.minus(this.a)
        return d.minus(d.project(otherDir));
    }
}

export class Size {
    width: number;
    height: number;
    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
    }
    clone() {
        return new Size(this.width, this.height);
    }


    toString() {
        return [this.width, this.height].join('x')
    }

    area() {
        return this.width * this.height;
    }
}

/**
 * A screen rectangle. A (0, 0) origin represents the top left of a display
 * area. Units are typically pixels.
 */
export class Rect {
    origin: XY;
    size: Size;
    constructor(origin: XY, size: Size) {
        this.origin = origin;
        this.size = size;
    }
    clone() {
        return new Rect(this.origin.clone(), this.size.clone());
    }

    toString() {
        return [this.origin, this.size].join(' ');
    }

    equal(r: Rect, tol: number) {
        const close = (a: number, b: number) => Math.abs(a - b) <= tol;
        return (close(this.origin.x, r.origin.x) &&
            close(this.origin.y, r.origin.y) &&
            close(this.size.width, r.size.width) &&
            close(this.size.height, r.size.height));
    }

    inset(s: Size) {
        return new Rect(
            new XY(this.origin.x + s.width, this.origin.y + s.height),
            new Size(this.size.width - 2 * s.width,
                this.size.height - 2 * s.height));
    }

    edges() {
        const down = new XY(0, this.size.height);
        const right = new XY(this.size.width, 0);
        const seg = (a: XY, b: XY) => LineSegment.fromTwoPoints(a, b);
        // a---b
        // c---d
        const a = this.origin;
        const b = a.plus(right)
        const c = a.plus(down)
        const d = c.plus(right)

        const rv = new Edges({
            top: seg(a, b),
            right: seg(b, d),
            bottom: seg(c, d),
            left: seg(a, c)
        });
        return rv;
    }

    translate(vec: XY) {
        return new Rect(this.origin.plus(vec), this.size);
    }

    // Increases or decreases the size of the rectangle by moving one of its
    // edges d units along the postive x or y axis, where positive x is right
    // and positive y is down.
    translateEdge(side: Side, d: number): Rect {
        const [w, h] = [this.size.width, this.size.height];
        switch (side) {
            case Side.Top:
                return new Rect(this.origin.plus(new XY(0, d)), new Size(w, h - d));
            case Side.Bottom:
                return new Rect(this.origin, new Size(w, h + d));
            case Side.Right:
                return new Rect(this.origin, new Size(w + d, h));
            case Side.Left:
                return new Rect(this.origin.plus(new XY(d, 0)), new Size(w - d, h));
            default:
                throw TypeError('bad side type ' + side);
        }
    }

    topLeft() {
        return this.origin
    }

    topRight() {
        return this.origin.plus(new XY(this.size.width, 0))
    }

    bottomRight() {
        return this.origin.plus(new XY(this.size.width, this.size.height))
    }

    bottomLeft() {
        return this.origin.plus(new XY(0, this.size.height))
    }

    intersection(other: Rect): Rect {
        // Not optimized, but that's not necessary.
        const origin = new XY(Math.max(this.topLeft().x, other.topLeft().x),
            Math.max(this.topLeft().y, other.topLeft().y));
        const br = new XY(Math.min(this.bottomRight().x, other.bottomRight().x),
            Math.min(this.bottomRight().y, other.bottomRight().y));
        const sizeXY = br.minus(origin);
        const size = new Size(sizeXY.x, sizeXY.y);
        if (size.width < 0 || size.height < 0) {
            return new Rect(new XY(0, 0), new Size(0, 0));
        }
        return new Rect(origin, size);
    }

    valid() {
        return this.size.width >= 0 && this.size.height >= 0
    }
}

export enum Side {
    Top = "TOP",
    Right = "RIGHT",
    Bottom = "BOTTOM",
    Left = "LEFT",
}

export class Edges {
    readonly top: LineSegment;
    readonly right: LineSegment;
    readonly bottom: LineSegment;
    readonly left: LineSegment;

    constructor(obj: {
        top: LineSegment,
        left: LineSegment,
        bottom: LineSegment,
        right: LineSegment
    }) {
        this.top = obj.top;
        this.left = obj.left;
        this.bottom = obj.bottom;
        this.right = obj.right;
    }

    getSide(s: Side): LineSegment {
        switch (s) {
            case Side.Top: return this.top;
            case Side.Right: return this.right;
            case Side.Bottom: return this.bottom;
            case Side.Left: return this.left;
        }
    }
}

export function adjoiningSides(a: Edges, b: Edges, distTol: number) {
    const sides = [Side.Top, Side.Bottom, Side.Left, Side.Right];

    const result = [];
    for (let sa of sides) {
        for (let sb of sides) {
            const sega = a.getSide(sa);
            const segb = b.getSide(sb);
            if (sega.adjoins(segb, distTol)) {
                result.push([sa, sb]);
            }
        }
    }
    return result;
}

function withinTol(a: number, b: number, tol: number) {
    return Math.abs(a - b) <= tol;
}
