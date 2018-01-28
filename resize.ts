import { TileSpec, Rect, XY, Side, Edges } from "./tilespec"

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
}

export function coincidentEdgeMoves(move: MoveSpec, otherWindows: Array<Rect>, workArea: Rect) {
    //const result: Array<MoveSpec> = otherWindows.map(x => null);
    const result: { [s: number]: MoveSpec  } = {};

    if (otherWindows.length === 3) {
        result[1] = move;
    }
    return result;
}

/*
export function isZero(spec: TileSpec) {
    return spec.gridWidth === 0;
}

function (workArea: Rect, margin: Size, totalWindowCount: number): Array<TileSpec> {

}

function mainAndListRects(workArea: Rect, margin: Size, totalWindowCount: number): Array<TileSpec> {
    if (totalWindowCount === 0) {
        return [];
    }

    if (!focusMetaWindow) {
        return;
    }
        reset_window(focusMetaWindow);

        let monitor = this.grid.monitor;
        let workArea = getWorkAreaByMonitor(monitor);
        let windows = getNotFocusedWindowsOfMonitor(monitor);

        move_resize_window_with_margins(
            focusMetaWindow,
            workArea.x,
            workArea.y,
            workArea.width/2,
            workArea.height);

        let winHeight = workArea.height/windows.length;
        let countWin = 0;

        //log("MonitorHeight: "+monitor.height+":"+windows.length );

        for (let windowIdx in windows) {
            let metaWindow = windows[windowIdx].meta_window;

            let newOffset = workArea.y + (countWin * winHeight);
            reset_window(metaWindow);

            move_resize_window_with_margins(
                metaWindow,
                workArea.x + workArea.width/2,
                newOffset,
                workArea.width/2,
                winHeight
            );
            countWin++;
        }

        log("AutoTileMainAndList _onButtonPress Emitting signal resize-done");
        this.emit('resize-done');
    }
}
*/
