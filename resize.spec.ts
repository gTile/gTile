import {LineSegment, XY, parsePreset, adjoiningEdges, Edges, Side, Rect, Size} from './tilespec';
import {coincidentEdgeMoves, MoveSpec, CoincidentMoveOptions} from './resize';

const opts = new CoincidentMoveOptions(
    new Size(.1, .1)
);

describe("coincidentEdgeMoves", function() {
    const move = new MoveSpec(
        new Rect(new XY(10, 10), new Size(90, 190)),
        new Rect(new XY(5, 10), new Size(90, 190)));

    const workArea = new Rect(new XY(0, 0), new Size(10000, 10000));

    it("move rect shares right edge with left edge of other window", function() {
        // A rect that shares a full left edge with the right edge of the moved
        // rectangle should have its left edge adjusted.
        const other = new Rect(new XY(100, 10), new Size(200, 190));

        //expect(adjoiningEdges(move.initial.
        expect(coincidentEdgeMoves(move, [other], workArea, opts))
            .toEqual({
                0: new MoveSpec(
                    other,
                    new Rect(new XY(95, 10), new Size(205, 190)))
            });
    });
    it("edge translations uniform", function() {
        const move = new MoveSpec(
            new Rect(new XY(0, 579), new Size(1280, 1572)),
            new Rect(new XY(0, 579), new Size(1180, 1572)));
        // Other windows
        const otherWindows = [
            new Rect(new XY(1280, 579), new Size(1280, 786)),
            new Rect(new XY(1280, 579), new Size(1280, 786)),
            new Rect(new XY(1280, 1365), new Size(1280, 786))];
        const shifted = [
            new Rect(new XY(1180, 579), new Size(1380, 786)),
            new Rect(new XY(1180, 579), new Size(1380, 786)),
            new Rect(new XY(1180, 1365), new Size(1380, 786))];
        const workArea = new Rect(new XY(0, 579), new Size(2560, 1573));
        expect(coincidentEdgeMoves(move, otherWindows, workArea, opts))
            .toEqual({
                0: new MoveSpec(otherWindows[0], shifted[0]),
                1: new MoveSpec(otherWindows[1], shifted[1]),
                2: new MoveSpec(otherWindows[2], shifted[2]),
            });
    });

});

const sides = [Side.Top, Side.Right, Side.Bottom, Side.Left];

function translations(move: MoveSpec) {
    return sides.map(s => move.edgeTranslationDistance(s));
}

describe("Movespec.edgeTranslationDistance - simple translation", function() {
    it("edge translations uniform", function() {
        const move = new MoveSpec(
            new Rect(new XY(10, 10), new Size(90, 190)),
            new Rect(new XY(5, 3), new Size(90, 190)));
        expect(translations(move)).toEqual([-7, -5, -7, -5])
    });
    it("edge translations non-uniform", function() {
        const move = new MoveSpec(
            new Rect(new XY(10, 10), new Size(90, 190)),
            new Rect(new XY(5, 3), new Size(80, 170)));
        expect(translations(move)).toEqual([-7, -15, -27, -5])
    });
});
