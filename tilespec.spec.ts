import {LineSegment, XY, parsePreset, adjoiningEdges, Edges, Side, Rect, Size} from './tilespec';

describe('1 = 1', () => {
    it('should do that', () => {
        expect(1).toBe(1);
    });
});

describe("TileSpec.parsePreset", function() {
    it("parsePreset should work", function () {
        const roundtrip = function(s) {
            return parsePreset(s)
                .map(x => x.toString())
                .join(', ');
        };
        expect(roundtrip('3x3 0:0 1:1, 2x2 0:0 0:0'))
            .toBe('3x3 0:0 1:1, 2x2 0:0 0:0');
    });
});

describe("TileSpec.XY.dot", function() {
    it("[1, 2].[3, 4]", function () {
        expect(new XY(1, 2).dot(new XY(3, 4))).toBe(1*3 + 2*4);
    });
});

describe("XY", function() {
    const [xUnit, yUnit] = [new XY(1, 0), new XY(0, 1)];
    it("units are equal to selves", () => {
        expect(xUnit).toEqual(xUnit.unit());
        expect(yUnit).toEqual(yUnit.unit());
    });

    it("project", () => {
        expect(new XY(40, .00124).project(xUnit.scale(1000)))
            .toEqual(new XY(40, 0));
    });
});

describe("TileSpec.LineSegment", function() {
    const a = LineSegment.fromTwoPoints(new XY(0, 5), new XY(0, 10));
    const b = LineSegment.fromTwoPoints(new XY(4, 0), new XY(4, 10));

    it("unit is 1", function() {
        expect(a.direction()).toEqual(new XY(0, 1));
        expect(b.direction()).toEqual(new XY(0, 1));
    });

    it("scaled direction is 3", function() {
        expect(a.direction().scale(3)).toEqual(new XY(0, 3));
    });

    it("[0, 5]->[0, 10] is 4 away from [4, 0]->[4, 10]", function () {
        expect(a.perpVectorBetweenLines(b)).toEqual(new XY(4, 0));
        expect(b.perpVectorBetweenLines(a)).toEqual(new XY(-4, 0));
        expect(a.lineDistance(b)).toEqual(4);
    });

    it("[0, 5]->[0, 10] is 4 away from [4, 0]->[4, 10]", function () {
        const x = LineSegment.fromTwoPoints(new XY(4, 0), new XY(4, 10));
        expect(a.perpVectorBetweenLines(b)).toEqual(new XY(4, 0));
        expect(a.lineDistance(b)).toEqual(4);
    });

    it("[0, 5]->[0, 10] unit dot is 1", function () {
        expect(a.direction().dot(b.direction())).toEqual(1);
    });
});

describe("adjoiningEdges", function() {
    const a = new Rect(new XY(10, 10), new Size(90, 190));
    const tol = .01;

    it("inset rect does not have adjoining edges", function() {
        const aInsert = a.inset(new Size(5, 5));
        expect(asArray(adjoiningEdges(a.edges(), aInsert.edges(), tol)))
            .toEqual([]);
    });

    it("rect adjoins with its own edges", function() {
        const aInsert = a.inset(new Size(0, 0));
        expect(asArray(adjoiningEdges(a.edges(), aInsert.edges(), tol)))
            .toEqual([
                [Side.Top, Side.Top],
                [Side.Bottom, Side.Bottom],
                [Side.Left, Side.Left],
                [Side.Right, Side.Right],
            ]);
    });

    it("rect adjoins with a shifted copy (shift right)", function() {
        const b = a.translate(new XY(a.size.width, 20));
        expect(asArray(adjoiningEdges(a.edges(), b.edges(), tol)))
            .toEqual([
                [Side.Right, Side.Left],
            ]);
    });
    it("rect adjoins with a shifted copy (shift down)", function() {
        const b = a.translate(new XY(20, a.size.height));
        expect(asArray(adjoiningEdges(a.edges(), b.edges(), tol)))
            .toEqual([
                [Side.Bottom, Side.Top],
            ]);
    });
    it("rect adjoins with a shifted copy (shift left)", function() {
        const b = a.translate(new XY(-a.size.width,20));
        expect(asArray(adjoiningEdges(a.edges(), b.edges(), tol)))
            .toEqual([
                [Side.Left, Side.Right],
            ]);
    });
    it("rect adjoins with a shifted copy (shift up)", function() {
        const b = a.translate(new XY(32, -a.size.height));
        expect(asArray(adjoiningEdges(a.edges(), b.edges(), tol)))
            .toEqual([
                [Side.Top, Side.Bottom],
            ]);
    });
});

describe("Rect.translateEdge", function() {
    const a = new Rect(new XY(10, 10), new Size(42, 80));

    it("increase bottom", function() {
        expect(a.translateEdge(Side.Bottom, 4))
            .toEqual(new Rect(new XY(10, 10), new Size(42, 84)));
    });
    it("increase top", function() {
        expect(a.translateEdge(Side.Top, 4))
            .toEqual(new Rect(new XY(10, 14), new Size(42, 76)));
    });
    it("increase right", function() {
        expect(a.translateEdge(Side.Right, 4))
            .toEqual(new Rect(new XY(10, 10), new Size(46, 80)));
    });
    it("increase left", function() {
        expect(a.translateEdge(Side.Left, -3))
            .toEqual(new Rect(new XY(7, 10), new Size(45, 80)));
    });
});

describe("Rect.intersection", function() {
    const a = new Rect(new XY(10, 100), new Size(42, 80));
    const b = new Rect(new XY(40, 99), new Size(42, 80));

    it("area of intersection", function() {
        expect(a.intersection(b).size.area())
            .toEqual(79*12);
    });

    it("intersection", function() {
        expect(a.intersection(b))
            .toEqual(new Rect(new XY(40, 100), new Size(12, 79)));
    });
});

function asArray<T>(x: Array<T>): Array<T> {
    let list = [];
    for (let item of x) {
        list.push(item);
    }
    return list;
}
