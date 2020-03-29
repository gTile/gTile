'use strict'
/* Edited by Sergey after 
https://github.com/tpyl/gssnaptoneighbors
 by Timo Pylvanainen <tpyl@iki.fi>
 */

const Gio = imports.gi.Gio;
const Meta = imports.gi.Meta;
const Shell = imports.gi.Shell;
const St = imports.gi.St;
const Tweener = imports.ui.tweener;

const Main = imports.ui.main;

const WorkspaceManager = global.screen || global.workspace_manager;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Log = Me.imports.logging;

const OVERLAP_TOLERANCE = 5;
const SCAN_BOX_SIZE = 50;

function log(log_string) {
    Log.log(log_string);
}

/**
 * Return all windows on the currently active workspace
 */
function getWindowsOnActiveWorkspace() {
    let windows = [];
    let windowActors = global.get_window_actors();

    let curWorkSpace = WorkspaceManager.get_active_workspace();

    for (let i = 0; i < windowActors.length; i++) {
        let win = windowActors[i].meta_window;
        if(win.located_on_workspace(curWorkSpace) &&
            !win.minimized && 
            win.get_frame_type() == 0) {
            windows.push(win);
        }
    }

    return windows;
}

/**
 * Find the maximum horzontal expansion from x and
 * returns minx, maxx. The initial maximum x is given
 * as argument, and the expansion is never larger than 
 * that. 
 *
 * The upper and lower limits define the y coordinate
 * range to check for overlapping windows. 
 */
function expandHorizontally(x, upper, lower, minx, maxx, windows) {

    for (let i = 0; i < windows.length; i++) {
        let rect = windows[i].get_frame_rect();
        
        let wt = rect.y;
        let wb = rect.y + rect.height;
        let wl = rect.x;
        let wr = rect.x + rect.width;

        // Check only  if the window overlaps vertically
        if(wb > upper && wt  < lower) {
            if(wr < x && minx < wr) {
                minx = wr;
            }
            if(wl > x && wl < maxx) {
                maxx = wl;
            }
        }
    }

    return {min: minx, max: maxx};
}


/**
 * Find the maximum vertical expansion from  y, and
 * returns miny, maxy. The initial maximum y is given
 * as argument, and the expansion is never larger than 
 * that. 
 *
 * The left and right limits define the x coordinate
 * range to check for overlapping windows. 
 */
function expandVertically(y, left, right, miny, maxy, windows) {

    for (let i = 0; i < windows.length; i++) {
        let rect = windows[i].get_frame_rect();
        
        let wt = rect.y;
        let wb = rect.y + rect.height;
        let wl = rect.x;
        let wr = rect.x + rect.width;

        // Check only  if the window overlaps horizontally
        if(wr > left && wl  < right) {
            if(wb < y && miny < wb) {
                miny = wb;
            }
            if(wt > y && wt < maxy) {
                maxy = wt;
            }
        }
    }

    return {min: miny, max: maxy};
}

/**
 * Resize & move the *window* so it touches adjacent windows or
 * screen edge top, bottom, left and right. The top-left corner 
 * of the window defines the expansion point. 
 *
 * There is an L-ambiguity where the window could be expanded 
 * both vertically and horizontally. The expnasion that results
 * in closer to 1 aspect ratio is selected. 
 */
function snapToNeighbors(window) {
	log("snapToNeighbors " + window.get_title());
    // Unmaximize first
    if (window.maximized_horizontally || window.maximizedVertically)
        window.unmaximize(Meta.MaximizeFlags.HORIZONTAL | Meta.MaximizeFlags.VERTICAL);

    let workArea = window.get_work_area_current_monitor();
    let myrect = window.get_frame_rect();

    let windows = getWindowsOnActiveWorkspace();

    // Scan for overlapping windows in a thin bar around the top of the 
    // window. The vertical height of the window will be adjusted later. 
    let maxHorizw = expandHorizontally(
        myrect.x + Math.min(SCAN_BOX_SIZE, myrect.width / 2), 
        myrect.y + Math.min(SCAN_BOX_SIZE, myrect.height / 2), 
        myrect.y + Math.min(SCAN_BOX_SIZE, myrect.height / 2) + SCAN_BOX_SIZE,
        workArea.x, 
        workArea.x + workArea.width,
        windows
    );

    let maxHorizh = expandVertically(
        myrect.y + Math.min(SCAN_BOX_SIZE, myrect.height / 2),
        maxHorizw.min + OVERLAP_TOLERANCE,
        maxHorizw.max - OVERLAP_TOLERANCE, 
        workArea.y, 
        workArea.y + workArea.height,
        windows)

    let maxVerth = expandVertically(
        myrect.y + Math.min(SCAN_BOX_SIZE, myrect.height / 2),
        myrect.x + Math.min(SCAN_BOX_SIZE, myrect.width / 2), 
        myrect.x + Math.min(SCAN_BOX_SIZE, myrect.width / 2) + SCAN_BOX_SIZE, 
        workArea.y, 
        workArea.y + workArea.height,
        windows)

    let maxVertw = expandHorizontally(
        myrect.x + Math.min(SCAN_BOX_SIZE, myrect.width / 2),
        maxVerth.min + OVERLAP_TOLERANCE, 
        maxVerth.max - OVERLAP_TOLERANCE, 
        workArea.x,
        workArea.x + workArea.width, 
        windows);

    if ((maxHorizw.max - maxHorizw.min) * (maxHorizh.max - maxHorizh.min) > 
        (maxVertw.max - maxVertw.min) * (maxVerth.max - maxVerth.min)) {
        window.move_resize_frame(
            true,
            maxHorizw.min,
            maxHorizh.min, 
            maxHorizw.max - maxHorizw.min, 
            maxHorizh.max - maxHorizh.min
            );
    } else {
        window.move_resize_frame(
            true,
            maxVertw.min,
            maxVerth.min, 
            maxVertw.max - maxVertw.min, 
            maxVerth.max - maxVerth.min
            );
    }
}

