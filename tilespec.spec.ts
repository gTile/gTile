import { expect } from 'chai';
// import {describe, it} from 'mocha';

import {LineSegment, XY, parsePreset, adjoiningSides, Edges, Side, Rect, Size} from './tilespec';

describe('1 = 1', () => {
    it('should do that', () => {
        expect(1).eq(1);
    });
});

describe("TileSpec.parsePreset success cases", function() {
    const cases: Array<[string, string]> = [
        [
            '3x3 0:0 1:1, 2x2 0:0 0:0',
            '3x3 0:0 1:1, 2x2 0:0 0:0',
        ],
        [
            '3x3 0:0 1:1,     0:0 0:0, 4x4 0:0 0:0,     0:2 3:3',
            '3x3 0:0 1:1, 3x3 0:0 0:0, 4x4 0:0 0:0, 4x4 0:2 3:3',
        ],
        [
            '3x3 0:0 1:1, 0:0 0:0',
            '3x3 0:0 1:1, 3x3 0:0 0:0',
        ],
    ];
    for (let [input, output] of cases) {
        it(`${JSON.stringify(input)} roundtrips to ${JSON.stringify(output)}`, function () {
            const roundtrip = function(s: string) {
                return parsePreset(s)
                    .map(x => x.toString())
                    .join(', ');
            };
            expect(roundtrip(input)).equal(output);
        });
    }
});

describe("TileSpec.parsePreset error cases", function() {
    const badPresets = [
        '0:0 1:1',
        '3:b 1:1',
        '3x3 0:b 1:1',
        '3xa 0:0 1:1',
        '3x3 0:a 1:1',
        '3x3 0:0 1:a',
        'xx3 0:0 1:0',
        '3x3 x:0 1:0',
        '3x3 0:0 x:0',
        'bx3 0:0 1:0',
        '3x3 b:0 1:0',
        '3x3 0:0 b:0',
    ];
    for (let input of badPresets) {
        it(`${JSON.stringify(input)} is invalid`, () => {
            expect(() => {parsePreset(input);}).throws();
        });
    }
});

describe("TileSpec.XY.dot", function() {
    it("[1, 2].[3, 4]", function () {
        expect(new XY(1, 2).dot(new XY(3, 4))).equal(1*3 + 2*4);
    });
});

describe("XY", function() {
    const [xUnit, yUnit] = [new XY(1, 0), new XY(0, 1)];
    it("units are equal to selves", () => {
        expect(xUnit).eql(xUnit.unit());
        expect(yUnit).eql(yUnit.unit());
    });

    it("project", () => {
        expect(new XY(40, .00124).project(xUnit.scale(1000)))
            .eql(new XY(40, 0));
    });
});

describe("TileSpec.LineSegment", function() {
    const a = LineSegment.fromTwoPoints(new XY(0, 5), new XY(0, 10));
    const b = LineSegment.fromTwoPoints(new XY(4, 0), new XY(4, 10));

    it("unit is 1", function() {
        expect(a.direction()).eql(new XY(0, 1));
        expect(b.direction()).eql(new XY(0, 1));
    });

    it("scaled direction is 3", function() {
        expect(a.direction().scale(3)).eql(new XY(0, 3));
    });

    it("[0, 5]->[0, 10] is 4 away from [4, 0]->[4, 10]", function () {
        expect(a.perpVectorBetweenLines(b)).eql(new XY(4, 0));
        expect(b.perpVectorBetweenLines(a)).eql(new XY(-4, 0));
        expect(a.lineDistance(b)).eql(4);
    });

    it("[0, 5]->[0, 10] is 4 away from [4, 0]->[4, 10]", function () {
        const x = LineSegment.fromTwoPoints(new XY(4, 0), new XY(4, 10));
        expect(a.perpVectorBetweenLines(b)).eql(new XY(4, 0));
        expect(a.lineDistance(b)).eql(4);
    });

    it("[0, 5]->[0, 10] unit dot is 1", function () {
        expect(a.direction().dot(b.direction())).eql(1);
    });
});

describe("adjoiningSides", function() {
    const a = new Rect(new XY(10, 10), new Size(90, 190));
    const tol = .01;

    it("inset rect does not have adjoining edges", function() {
        const aInsert = a.inset(new Size(5, 5));
        expect(asArray(adjoiningSides(a.edges(), aInsert.edges(), tol)))
            .eql([]);
    });

    it("rect adjoins with its own edges", function() {
        const aInsert = a.inset(new Size(0, 0));
        expect(asArray(adjoiningSides(a.edges(), aInsert.edges(), tol)))
            .eql([
                [Side.Top, Side.Top],
                [Side.Bottom, Side.Bottom],
                [Side.Left, Side.Left],
                [Side.Right, Side.Right],
            ]);
    });

    it("rect adjoins with a shifted copy (shift right)", function() {
        const b = a.translate(new XY(a.size.width, 20));
        expect(asArray(adjoiningSides(a.edges(), b.edges(), tol)))
            .eql([
                [Side.Right, Side.Left],
            ]);
    });
    it("rect adjoins with a shifted copy (shift down)", function() {
        const b = a.translate(new XY(20, a.size.height));
        expect(asArray(adjoiningSides(a.edges(), b.edges(), tol)))
            .eql([
                [Side.Bottom, Side.Top],
            ]);
    });
    it("rect adjoins with a shifted copy (shift left)", function() {
        const b = a.translate(new XY(-a.size.width,20));
        expect(asArray(adjoiningSides(a.edges(), b.edges(), tol)))
            .eql([
                [Side.Left, Side.Right],
            ]);
    });
    it("rect adjoins with a shifted copy (shift up)", function() {
        const b = a.translate(new XY(32, -a.size.height));
        expect(asArray(adjoiningSides(a.edges(), b.edges(), tol)))
            .eql([
                [Side.Top, Side.Bottom],
            ]);
    });
});

describe("Rect.translateEdge", function() {
    const a = new Rect(new XY(10, 10), new Size(42, 80));

    it("increase bottom", function() {
        expect(a.translateEdge(Side.Bottom, 4))
            .eql(new Rect(new XY(10, 10), new Size(42, 84)));
    });
    it("increase top", function() {
        expect(a.translateEdge(Side.Top, 4))
            .eql(new Rect(new XY(10, 14), new Size(42, 76)));
    });
    it("increase right", function() {
        expect(a.translateEdge(Side.Right, 4))
            .eql(new Rect(new XY(10, 10), new Size(46, 80)));
    });
    it("increase left", function() {
        expect(a.translateEdge(Side.Left, -3))
            .eql(new Rect(new XY(7, 10), new Size(45, 80)));
    });
});

describe("Rect.intersection", function() {
    const a = new Rect(new XY(10, 100), new Size(42, 80));
    const b = new Rect(new XY(40, 99), new Size(42, 80));

    it("area of intersection", function() {
        expect(a.intersection(b).size.area())
            .eql(79*12);
    });

    it("intersection", function() {
        expect(a.intersection(b))
            .eql(new Rect(new XY(40, 100), new Size(12, 79)));
    });
});

function asArray<T>(x: Array<T>): Array<T> {
    let list = [];
    for (let item of x) {
        list.push(item);
    }
    return list;
}