/**
 * TileSpec represents a rectangular area on display by means of specifying a
 * number of evenly spaced tiles and two corners.
 *
 * The syntax
 */
export class TileSpec {
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

    toFrameRect(workArea: Rect) {
        const elemSize = new Size(
            Math.floor(workArea.size.width / this.gridWidth),
            Math.floor(workArea.size.height / this.gridHeight));
        return new Rect(
            new XY(
                workArea.origin.x  + this.luc.x * elemSize.width,
                workArea.origin.y  + this.luc.y * elemSize.height),
            new Size((this.rdc.x + 1 - this.luc.x) * elemSize.width,
                     (this.rdc.y + 1 - this.luc.y) * elemSize.height));
    }

}

export class XY {
    x: number;
    y: number;
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
        return this.x*b.x + this.y*b.y;
    }

    unit() {
        const norm = this.l2norm()
        return new XY(this.x/norm, this.y/norm);
    }

    l2norm() {
        return Math.sqrt(this.l2normSquared());
    }

    l2normSquared() {
        return this.dot(this);
    }

    scale(s: number) {
        return new XY(this.x*s, this.y*s)
    }

    project(b: XY): XY {
        return b.scale(
            this.dot(b)/b.l2normSquared());
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
    a: XY;
    b: XY;
    static fromTwoPoints(a: XY, b: XY) {
        const l = new LineSegment();
        l.a = a
        l.b = b
        return l
    }

    direction() {
        return this.b.minus(this.a).unit()
    }

    adjoins(other: LineSegment, distTol: number) {
        const otherDir = other.direction();
        const unitDot = this.direction().dot(otherDir);
        if (!withinTol(Math.abs(unitDot), 1, ADJOIN_DOT_PRODUCT_TOL)) {
            return false;
        }
        return this.lineDistance(other) < distTol
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

/*export class Line {
    origin: XY;
    direction: XY;
    static fromTwoPoints(a: XY, b: XY) {
        const l = new Line();
        l.origin = a
        l.direction = b.minus(a).unit()
        return l
    }

}
*/



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
                close(this.origin.y,  r.origin.y) &&
                close(this.size.width,  r.size.width) &&
                close(this.size.height,  r.size.height));
    }

    inset(s: Size) {
        return new Rect(
            new XY(this.origin.x + s.width, this.origin.y + s.height),
            new Size(this.size.width - 2*s.width,
                     this.size.height - 2*s.height));
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

        const rv = new Edges();
        rv.top = seg(a, b);
        rv.right = seg(b, d);
        rv.bottom = seg(c, d);
        rv.left = seg(a, c);
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
            return new Rect(this.origin.plus(new XY(0, d)), new Size(w, h-d));
        case Side.Bottom:
            return new Rect(this.origin,                    new Size(w, h+d));
        case Side.Right:
            return new Rect(this.origin,                    new Size(w+d, h));
        case Side.Left:
            return new Rect(this.origin.plus(new XY(d, 0)), new Size(w-d, h));
        default:
            throw TypeError('bad side type ' + side);
        }
    }
}

export enum Side {
    Top = "TOP",
    Right = "RIGHT",
    Bottom = "BOTTOM",
    Left = "LEFT",
}

export class Edges {
    top: LineSegment;
    right: LineSegment;
    bottom: LineSegment;
    left: LineSegment;

    getSide(s: Side): LineSegment {
        switch (s) {
        case Side.Top:    return this.top;
        case Side.Right:  return this.right;
        case Side.Bottom: return this.bottom;
        case Side.Left:   return this.left;
        }
    }
}

export function* adjoiningEdges(a: Edges, b: Edges, distTol: number) {
    const sides = [Side.Top, Side.Bottom, Side.Left, Side.Right];

    for (let sa of sides) {
        for (let sb of sides) {
            if (a.getSide(sa).adjoins(b.getSide(sb), distTol)) {
                yield [sa, sb];
            }
        }
    }
}




/** parsePreset parses a string like "8x8 0:0 0:7, 8x8 0:0 2:7" */
export function parsePreset(preset: string) {
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

function withinTol(a: number, b: number, tol: number) {
    return Math.abs(a - b) <= tol;
}
