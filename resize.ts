import { TileSpec, Rect, Size, XY, Side, Edges, adjoiningSides } from "./tilespec"

/** The vector space representation of moving window */
export class MoveSpec {
    initial: Rect;
    final: Rect;
    constructor(i: Rect, f: Rect) {
        this.initial = i;
        this.final = f;
    }
    /** Returns if the move is not actually a move at all. */
    isZero() {
        return this.initial.equal(this.final, 1);
    }

    edgeTranslationDistance(side: Side): number {
        const initEdge = this.initial.edges().getSide(side);
        const finalEdge = this.final.edges().getSide(side);
        const translationAxis = (side === Side.Top || side === Side.Bottom) ?
            new XY(0, 1) : new XY(1, 0);
        const displacementA = finalEdge.a.minus(initEdge.a);
        return displacementA.scalarProjection(translationAxis);
    }
}

export class CoincidentMoveOptions {
    minSize: Size
    maxEdgeDistance: number

    constructor(min: Size, maxEdgeDistance: number) {
        this.minSize = min
        this.maxEdgeDistance = maxEdgeDistance;
    }
}

export const DEFAULT_COINCIDENT_MOVE_OPTIONS = new CoincidentMoveOptions(
    new Size(200, 200),
    30);

/**
 * Given the move of one window, find coincident edges of other windows and
 * suggest moves if appropriate.
 */
export function coincidentEdgeMoves(move: MoveSpec, otherWindows: Array<Rect>, workArea: Rect, opts: CoincidentMoveOptions) {
    //const result: Array<MoveSpec> = otherWindows.map(x => null);
    const result: { [s: number]: MoveSpec  } = {};

    const workAreaPixels = workArea.size.area();
    if (workAreaPixels < opts.minSize.area()) {
        return result;
    }

    for (let i = 0; i < otherWindows.length; i++) {
        const suggestion = coincidentEdgeMove(move, otherWindows[i], workArea, opts);
        if (suggestion) {
            result[i] = new MoveSpec(otherWindows[i], suggestion);
        }
    }

    return result;
}

function coincidentEdgeMove(move: MoveSpec, otherWindow: Rect, workArea: Rect, opts: CoincidentMoveOptions) {
    const initialEdges = move.initial.edges();

    // Return a score from 0 to 1.
    const scoreCandidate = (r: Rect) => {
        if (tooSmall(r.size, opts)) {
            return 0
        }
        const wsIsect = r.intersection(workArea);
        if (wsIsect.size.area() / r.size.area() < .08) {
            return 0
        }

        return 1;
    }

    let candidateRect = otherWindow;
    let anyCoincident = false;
    let currentScore = 0.1;
    // For each matching edge, compute the translation amount from the
    // move. Use this to translate otherWindow.
    const moveInitialEdges = move.initial.edges();
    const otherEdges = otherWindow.edges();
    for (const [moveRectSide, otherEdgeSide] of
         adjoiningSides(moveInitialEdges, otherEdges, opts.maxEdgeDistance)) {
        if (moveRectSide === otherEdgeSide) {
            continue;
        }
        // residualVec is the normal vector from otherEdge -> moveEdge.
        const residualVec = otherEdges
            .getSide(otherEdgeSide)
            .perpVectorBetweenLines(moveInitialEdges.getSide(moveRectSide));
        const edgeTranslationAxis =
            (moveRectSide === Side.Left || moveRectSide == Side.Right) ?
            new XY(1, 0) : new XY(0, 1);
        const residualTrans = residualVec.dot(edgeTranslationAxis);

        const moveTrans = move.edgeTranslationDistance(moveRectSide) + residualTrans;
        const r = candidateRect.translateEdge(otherEdgeSide, moveTrans);
        const score = scoreCandidate(r);
        if (score >= currentScore) {
            currentScore = score;
            candidateRect = r;
            anyCoincident = true;
        }
    }
    if (anyCoincident) {
        return candidateRect;
    }
    return null;
}

function tooSmall(s: Size, opts: CoincidentMoveOptions) {
    return s.width < opts.minSize.width ||
        s.height < opts.minSize.height;
}
