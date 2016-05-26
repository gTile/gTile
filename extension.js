/*****************************************************************

  This extension has been developed by vibou

  With the help of the gnome-shell community

  Edited by Kvis for gnome 3.8
  Edited by Lundal for gnome 3.18

 ******************************************************************/

/*****************************************************************
  CONST & VARS
 *****************************************************************/
// Library imports
const St = imports.gi.St;
const Main = imports.ui.main;
const Shell = imports.gi.Shell;
const WindowManager = imports.ui.windowManager;
const MessageTray = imports.ui.messageTray;
const Lang = imports.lang;
const PanelMenu = imports.ui.panelMenu;
const DND = imports.ui.dnd;
const Meta = imports.gi.Meta;
const Clutter = imports.gi.Clutter;
const Signals = imports.signals;
const Tweener = imports.ui.tweener;
const Workspace = imports.ui.workspace;

// Extension imports
const Extension = imports.misc.extensionUtils.getCurrentExtension();
const hotkeys = Extension.imports.hotkeys;

// Globals
const SETTINGS_GRID_SIZE = 'grid-size';
const SETTINGS_AUTO_CLOSE = 'auto-close';
const SETTINGS_ANIMATION = 'animation';
const SETTINGS_IGNORE_PANEL = 'ignore-panel';
const SETTINGS_WINDOW_MARGIN = 'window-margin';
const SETTINGS_INSETS_PRIMARY = 'insets-primary';
const SETTINGS_INSETS_SECONDARY = 'insets-secondary';

let status;
let launcher;
let grids;
let monitors;
let tracker;
let nbCols;
let nbRows;
let area;
let focusMetaWindow = false;
let focusWindowActor = false;
let focusMetaWindowConnections = new Array();
let focusMetaWindowPrivateConnections = new Array();
let tracker;
let gridSettings = new Object();
let toggleSettingListener;

// Hangouts workaround
let excludedApplications = new Array(
    "Unknown"
);

const key_bindings = {
    'show-toggle-tiling': function() {
        toggleTiling();
    }
};

const GTileStatusButton = new Lang.Class({
    Name: 'GTileStatusButton',
    Extends: PanelMenu.Button,

    _init: function(classname) {
        this.parent(0.0, "gTile", false);

        this.actor.add_style_class_name(classname);
        //Done by default in PanelMenuButton - Just need to override the method
        this.actor.connect('button-press-event', Lang.bind(this, this._onButtonPress));
    },

    reset: function() {
        this.activated = false;
        launcher.actor.remove_style_pseudo_class('activate');
    },

    activate: function() {
        launcher.actor.add_style_pseudo_class('activate');
    },

    deactivate: function() {
        launcher.actor.remove_style_pseudo_class('activate');
    },

    _onButtonPress: function(actor, event) {
        //global.log("Click Toggle Status");
        toggleTiling();
    },

    _destroy: function() {
        this.activated = null;
    }

});


/*****************************************************************
  SETTINGS
 *****************************************************************/
/*INIT SETTINGS HERE TO ADD OR REMOVE SETTINGS BUTTON*/
/*new GridSettingsButton(LABEL, NBCOL, NBROW) */
function initSettings() {
    //Here is where you add new grid size button
    gridSettings[SETTINGS_GRID_SIZE] = [
        new GridSettingsButton('4x4',4,4),
        new GridSettingsButton('6x4',6,4),
        new GridSettingsButton('8x6',8,6),
    ];

    //You can change those settings to set whatever you want by default
    gridSettings[SETTINGS_AUTO_CLOSE] = true;
    gridSettings[SETTINGS_ANIMATION] = true;
    gridSettings[SETTINGS_IGNORE_PANEL] = false; //Set this to true if you have the top panel hidden
    gridSettings[SETTINGS_WINDOW_MARGIN] = 0; // small margin offset
    gridSettings[SETTINGS_INSETS_PRIMARY] = { top: 0, bottom: 0, left: 0, right: 0 }; // Insets on primary monitor
    gridSettings[SETTINGS_INSETS_SECONDARY] = { top: 0, bottom: 0, left: 0, right: 0 }; // Insets on secondary monitors
}


/*****************************************************************
  FUNCTIONS
 *****************************************************************/
function init() {

}

function enable() {
    status = false;
    monitors = Main.layoutManager.monitors;
    tracker = Shell.WindowTracker.get_default();

    area = new St.BoxLayout({style_class: 'grid-preview'});
    Main.uiGroup.add_actor(area);

    global.log("Create Button");
    launcher = new GTileStatusButton('tiling-icon');

    global.log("Init settings");
    initSettings();

    // initialize these from settings, the first set of sizes
    nbCols = gridSettings[SETTINGS_GRID_SIZE][0].cols;
    nbRows = gridSettings[SETTINGS_GRID_SIZE][0].rows;

    global.log("Init Grids");
    initGrids();

    global.log("Starting...");
    global.display.connect('notify::focus-window', Lang.bind(this, _onFocus))

    Main.panel.addToStatusArea("GTileStatusButton", launcher);

    hotkeys.bind(key_bindings);

    global.log("Extention Enabled !");
}

function disable() {
    hotkeys.unbind(key_bindings);
    destroyGrids();
    launcher.destroy();
    launcher = null;
    resetFocusMetaWindow();
}

function resetFocusMetaWindow() {
    if (focusMetaWindowConnections.length>0) {
        for (var idx in focusMetaWindowConnections) {
            focusMetaWindow.disconnect(focusMetaWindowConnections[idx]);
        }
    }

    if (focusMetaWindowPrivateConnections.length>0) {
        let actor = focusMetaWindow.get_compositor_private();
        if (actor) {
            for(var idx in focusMetaWindowPrivateConnections) {
                actor.disconnect(focusMetaWindowPrivateConnections[idx]);
            }
        }
    }

    focusMetaWindow = false;
    focusMetaWindowConnections = new Array();
    focusMetaWindowPrivateConnections = new Array();
}

function initGrids() {
    grids = new Array();
    for (let monitorIdx in monitors) {
        global.log("New Grid for monitor " + monitorIdx);

        let monitor = monitors[monitorIdx];

        let grid = new Grid(monitorIdx, monitor, "gTile", nbCols, nbRows);

        let key = getMonitorKey(monitor);
        grids[key] = grid;

        Main.layoutManager.addChrome(grid.actor, { trackFullscreen: true });
        grid.actor.set_opacity(0);
        grid.hide(true);
        grid.connect('hide-tiling', Lang.bind(this, hideTiling));
    }
}

function destroyGrids() {
    for (let monitorIdx in monitors) {
        let monitor = monitors[monitorIdx];
        let key = getMonitorKey(monitor);
        let grid = grids[key];
        grid.hide(true);
        Main.layoutManager.removeChrome(grid.actor);
    }
}

function refreshGrids() {
    global.log("Refresh");
    for (var gridIdx in grids) {
        let grid = grids[gridIdx];
        grid.refresh();
    }
}

function moveGrids() {
    if (!status) {
        return;
    }

    let window = focusMetaWindow;
    if (window) {
        for (var gridIdx in grids) {
            let grid = grids[gridIdx];
            let pos_x;
            let pos_y;

            let monitor = grid.monitor;
            if (window.get_monitor() == grid.monitor_idx) {
                pos_x = window.get_frame_rect().width / 2  + window.get_frame_rect().x;
                pos_y = window.get_frame_rect().height / 2  + window.get_frame_rect().y;
            }
            else {
                pos_x = monitor.x + monitor.width/2;
                pos_y = monitor.y + monitor.height/2;
            }

            pos_x = Math.floor(pos_x - grid.actor.width / 2);
            pos_y = Math.floor(pos_y - grid.actor.height / 2);

            if (window.get_monitor() == grid.monitor_idx) {
                pos_x = (pos_x < monitor.x) ? monitor.x : pos_x;
                pos_x = ((pos_x + grid.actor.width) >  (monitor.width+monitor.x)) ?  monitor.x + monitor.width - grid.actor.width : pos_x;
                pos_y = (pos_y < monitor.y) ? monitor.y : pos_y;
                pos_y = ((pos_y + grid.actor.height) > (monitor.height+monitor.y)) ? monitor.y + monitor.height - grid.actor.height : pos_y;
            }

            let time = (gridSettings[SETTINGS_ANIMATION]) ? 0.3 : 0.1;

            Tweener.addTween(
                grid.actor, {
                    time: time,
                    x:pos_x,
                    y:pos_y,
                    transition: 'easeOutQuad',
                    /*onComplete:updateRegions*/
                });
        }
    }
}

function updateRegions() {
    /*Main.layoutManager._chrome.updateRegions();*/

    refreshGrids();
    for (let idx in grids) {
        let grid = grids[idx];
        grid.elementsDelegate.reset();
    }
}

function reset_window(metaWindow) {
    metaWindow.unmaximize(Meta.MaximizeFlags.HORIZONTAL);
    metaWindow.unmaximize(Meta.MaximizeFlags.VERTICAL);
    metaWindow.unmaximize(Meta.MaximizeFlags.HORIZONTAL | Meta.MaximizeFlags.VERTICAL);
}

function _getInvisibleBorderPadding(metaWindow) {
    let outerRect = metaWindow.get_frame_rect();
    let inputRect = metaWindow.get_buffer_rect();
    let borderX = outerRect.x - inputRect.x;
    let borderY = outerRect.y - inputRect.y;

    return [borderX, borderY];
}

function _getVisibleBorderPadding(metaWindow) {
    let clientRect = metaWindow.get_frame_rect();
    let outerRect = metaWindow.get_frame_rect();

    let borderX = outerRect.width - clientRect.width
    let borderY = outerRect.height - clientRect.height;

    return [borderX, borderY];
}

function move_maximize_window(metaWindow, x, y) {
    let borderX,borderY,vBorderX,vBorderY;
    [borderX,borderY] = _getInvisibleBorderPadding(metaWindow);

    x = x - borderX;
    y = y - borderY;


    metaWindow.move_frame(true,x,y);
    metaWindow.maximize(Meta.MaximizeFlags.HORIZONTAL | Meta.MaximizeFlags.VERTICAL);
}

/**
 * Resizes window considering margin settings
 * @param metaWindow
 * @param x
 * @param y
 * @param width
 * @param height
 */
function move_resize_window_with_margins(metaWindow, x, y, width, height){
    move_resize_window(
        metaWindow,
        x + gridSettings[SETTINGS_WINDOW_MARGIN],
        y + gridSettings[SETTINGS_WINDOW_MARGIN],
        width - gridSettings[SETTINGS_WINDOW_MARGIN] * 2,
        height - gridSettings[SETTINGS_WINDOW_MARGIN] * 2
    )
}

function move_resize_window(metaWindow, x, y, width, height) {
    let [borderX,borderY] = _getInvisibleBorderPadding(metaWindow);
    let [vBorderX,vBorderY] = _getVisibleBorderPadding(metaWindow);

    global.log(metaWindow.get_title()+" "+borderY);

    x = x  ;//+ (vBorderX - 1);
    y = y  ;

    width = width - vBorderX;
    height = height - vBorderY ;

    /* To TEST
    win._overviewHint = {
        x: actor.x,
        y: actor.y,
        scale: actor.scale_x
    };
    */

    metaWindow.move_resize_frame(true,x,y,width,height);

    /*
    let actor = metaWindow.get_compositor_private();

    let origX = actor.x;
    let origY = actor.y;

    actor.x = origX;
    actor.y = origY;

    Tweener.addTween(
        actor,{
            time:0.2,
            transition: "easeOutQuad",
            opacity:0,
            onComplete:_onMovedAndResize,
            onCompleteParams: [metaWindow,x,y,width,height]
        });
    */
}

function _isMyWindow(win) {
    //global.log("meta-window: "+this.focusMetaWindow+" : "+win.meta_window);
    return (this.focusMetaWindow == win.meta_window);
}

function getWindowActor() {
    let windows = global.get_window_actors().filter(this._isMyWindow, this);
    focusWindowActor = windows[0];

    //global.log("window actor: "+focusWindowActor+":"+focusMetaWindow.get_compositor_private() );
}

function getNotFocusedWindowsOfMonitor(monitor) {
    let windows = global.get_window_actors().filter(function(w) {
        let app = tracker.get_window_app(w.meta_window);

        if (app == null) {
            return false;
        }

        let appName = app.get_name();

        //global.log("NotFocused - AppName: " + appName);

        return !contains(excludedApplications, appName)
            && w.meta_window.get_window_type() == Meta.WindowType.NORMAL
            && w.meta_window.get_workspace() == global.screen.get_active_workspace()
            && w.meta_window.showing_on_its_workspace()
            && monitors[w.meta_window.get_monitor()] == monitor
            && focusMetaWindow != w.meta_window;
    });

    return windows;
}

function getWindowsOfMonitor(monitor) {
    let windows = global.get_window_actors().filter(function(w) {
        return w.meta_window.get_window_type() != Meta.WindowType.DESKTOP
            && w.meta_window.get_workspace() == global.screen.get_active_workspace()
            && w.meta_window.showing_on_its_workspace()
            && monitors[w.meta_window.get_monitor()] == monitor;
    });

    return windows;
}

function _onFocus() {
    resetFocusMetaWindow();
    let window = getFocusApp();

    if (window) {
        global.log("_onFocus "+window);
        //global.log("Connect window: "+window.get_title());
        focusMetaWindow = window;
        focusMetaWindowConnections.push(focusMetaWindow.connect('notify::title',Lang.bind(this,_onFocus)));

        let actor = focusMetaWindow.get_compositor_private();
        if (actor) {
            focusMetaWindowPrivateConnections.push(focusMetaWindow.connect('size-changed',Lang.bind(this,moveGrids)));
            focusMetaWindowPrivateConnections.push(focusMetaWindow.connect('position-changed',Lang.bind(this,moveGrids)));
        }

        //global.log("End Connect window: "+window.get_title());

        let app = tracker.get_window_app(focusMetaWindow);
        let title = focusMetaWindow.get_title();

        for (let monitorIdx in monitors) {
            let monitor = monitors[monitorIdx];
            let key = getMonitorKey(monitor);
            let grid = grids[key];
            if (app) {
                grid.topbar._set_app(app,title);
            }
            else {
                grid.topbar._set_title(title);
            }
        }

        moveGrids();
    }
    else {
        hideTiling();
    }
}


function showTiling() {
    focusMetaWindow = getFocusApp();
    let wm_class = focusMetaWindow.get_wm_class();
    let wm_type = focusMetaWindow.get_window_type();
    let layer = focusMetaWindow.get_layer();

    //global.log("type:"+wm_type+" class:"+wm_class+" layer:"+layer);
    //global.log("focus app: "+focusMetaWindow);
    area.visible = true;
    if (focusMetaWindow && wm_type != 1 && layer > 0) {
        for (let monitorIdx in monitors) {
            let monitor = monitors[monitorIdx];
            let key = getMonitorKey(monitor);
            let grid = grids[key];
            //global.log("ancestor: "+grid.actor.get_parent());

            let window = getFocusApp();
            let pos_x;
            let pos_y;
            if (window.get_monitor() == monitorIdx) {
                pos_x = window.get_frame_rect().width / 2  + window.get_frame_rect().x;
                pos_y = window.get_frame_rect().height / 2  + window.get_frame_rect().y;
            }
            else {
                pos_x = monitor.x + monitor.width/2;
                pos_y = monitor.y + monitor.height/2;
            }

            grid.set_position(
                Math.floor(pos_x - grid.actor.width / 2),
                Math.floor(pos_y - grid.actor.height / 2)
            );

            grid.show();
        }

        _onFocus();
        status = true;
        launcher.activate();
    }

    moveGrids();
}

function hideTiling() {
    for (let gridIdx in grids) {
        let grid = grids[gridIdx];
        grid.elementsDelegate.reset();
        grid.hide(false);
    }

    area.visible = false;

    resetFocusMetaWindow();

    launcher.deactivate();
    status = false;
}

function toggleTiling() {
    if (status) {
        hideTiling();
    }
    else {
        showTiling();
    }
    return status;
}


function getMonitorKey(monitor) {
    return monitor.x+":"+monitor.width+":"+monitor.y+":"+monitor.height;
}

function contains(a, obj) {
    var i = a.length;
    while (i--) {
        if (a[i] === obj) {
            return true;
        }
    }
    return false;
}

function getFocusApp() {
    if (tracker.focus_app == null) {
        return false;
    }

    let focusedAppName = tracker.focus_app.get_name();

    if (contains(excludedApplications, focusedAppName)) {
        return false;
    }

    let windows = global.screen.get_active_workspace().list_windows();
    let focusedWindow = false;
    for (let i = 0; i < windows.length; ++i) {
        let metaWindow = windows[i];
        if (metaWindow.has_focus()) {
            focusedWindow = metaWindow;
            break;
        }
    }

    return focusedWindow;
}

function isPrimaryMonitor(monitor) {
    return Main.layoutManager.primaryMonitor.x == monitor.x;
}

function getWorkArea(monitor) {
    let insets = (isPrimaryMonitor(monitor)) ? gridSettings[SETTINGS_INSETS_PRIMARY] : gridSettings[SETTINGS_INSETS_SECONDARY];
    let topPanelSize = (isPrimaryMonitor(monitor) && !gridSettings[SETTINGS_IGNORE_PANEL]) ? Main.panel.actor.height : 0;
    return {
        x: monitor.x + insets.left,
        y: monitor.y + insets.top + topPanelSize,
        width: monitor.width - insets.left - insets.right,
        height: monitor.height - insets.top - insets.bottom - topPanelSize
    };
}

/*****************************************************************
  PROTOTYPES
 *****************************************************************/

function TopBar(title) {
    this._init(title);
}

TopBar.prototype = {

    _init: function(title) {
        this.actor = new St.BoxLayout({style_class:'top-box'});
        this._title = title;

        this._stlabel =  new St.Label({style_class: 'grid-title', text: this._title});
        // this._iconBin = new St.Bin({ x_fill: false, y_fill: true });

        this._closebutton = new GTileStatusButton('close-button');
        this._closebutton.container.add_style_class_name('close-button-container');

        //this.actor.add_actor(this._iconBin);
        this.actor.add_actor(this._closebutton.container,{x_fill: false, expand: true, x_align:St.Align.END});
        this.actor.add_actor(this._stlabel,{x_fill: false, expand: false, x_align: St.Align.MIDDLE});

        //global.log( this._closebutton.actor);
        //this.actor.add_actor(this._closebutton.container,{x_fill: false,expand: true,x_align:
    },

    _set_title: function(title) {
        this._title = title;
        this._stlabel.text = this._title;
    },

    _set_app: function(app, title) {
        this._title = app.get_name()+" - "+title;
        //global.log("title: "+this._title);
        this._stlabel.text = this._title;
        // this._icon = app.create_icon_texture(24);

        //this._iconBin.set_size(24, 24);
        //this._iconBin.child = this._icon;
    },
};

function ToggleSettingsButtonListener() {
    this._init();
};

ToggleSettingsButtonListener.prototype = {
    _init: function() {
        this.actors = new Array();
    },

    addActor: function(actor) {
               actor.connect('update-toggle', Lang.bind(this, this._updateToggle));
               this.actors.push(actor);
    },

    _updateToggle: function() {
        for (let actorIdx in this.actors) {
            let actor = this.actors[actorIdx];
            actor._update();
        }
    }
};

function ToggleSettingsButton(text, property) {
    this._init(text,property);
};

ToggleSettingsButton.prototype = {
    _init: function(text, property) {
        this.text = text;
        this.actor = new St.Button({
            style_class: 'settings-button',
            reactive: true,
            can_focus:true,
            track_hover: true
        });
        this.label = new St.Label({style_class: 'settings-label', reactive:true, can_focus:true, track_hover:true, text: this.text});
        this.icon = new St.BoxLayout({style_class: this.text+"-icon", reactive:true, can_focus:true, track_hover:true});
        this.actor.add_actor(this.icon);
        this.property = property;
        this._update();
        this.actor.add_actor(this.icon, {x_fill:true, y_fill:true});
        this.actor.connect('button-press-event', Lang.bind(this, this._onButtonPress));
        this.connect('update-toggle', Lang.bind(this, this._update))
    },

    _update : function() {
        if (gridSettings[this.property]) {
            this.actor.add_style_pseudo_class('activate');
        }
        else {
            this.actor.remove_style_pseudo_class('activate');
        }
    },

    _onButtonPress : function() {
        gridSettings[this.property] = !gridSettings[this.property];
        //global.log(this.property+": "+gridSettings[this.property]);
        this.emit('update-toggle');
    }
};

Signals.addSignalMethods(ToggleSettingsButton.prototype);

function ActionButton(grid, classname) {
    this._init(grid, classname);
}

ActionButton.prototype = {
    _init: function(grid,classname) {
        this.grid = grid;
        this.actor = new St.Button({style_class: 'settings-button',
            reactive: true,
            can_focus:true,
            track_hover: true
        });

        this.icon = new St.BoxLayout({style_class: classname, reactive:true, can_focus:true, track_hover:true });
        this.actor.add_actor(this.icon);

        this.actor.add_actor(this.icon);
        this.actor.connect('button-press-event', Lang.bind(this, this._onButtonPress));
    },

    _onButtonPress: function() {
        this.emit('button-press-event');
    }
};

Signals.addSignalMethods(ActionButton.prototype);

function AutoTileMainAndList(grid) {
    this._init(grid,"action-main-list");
}

AutoTileMainAndList.prototype = {
    __proto__: ActionButton.prototype,

    _init: function(grid, classname) {
        ActionButton.prototype._init.call(this, grid, classname);
        this.classname = classname;
        this.connect('button-press-event', Lang.bind(this, this._onButtonPress));
    },

    _onButtonPress: function() {
        if (!focusMetaWindow) {
                return;
        }
        reset_window(focusMetaWindow);

        let monitor = this.grid.monitor;
        let workArea = getWorkArea(monitor);
        let windows = getNotFocusedWindowsOfMonitor(monitor);

        move_resize_window_with_margins(
            focusMetaWindow,
            workArea.x,
            workArea.y,
            workArea.width/2,
            workArea.height);

        let winHeight = workArea.height/windows.length;
        let countWin = 0;

        //global.log("MonitorHeight: "+monitor.height+":"+windows.length );

        for (let windowIdx in windows) {
            let metaWindow = windows[windowIdx].meta_window;
            /*let wm_type = metaWindow.get_window_type();
            let layer = metaWindow.get_layer();
            global.log(metaWindow.get_title()+" "+wm_type+" "+layer);*/

            let newOffset = workArea.y + (countWin * winHeight);
            //global.log("newOffset: "+ newOffset);
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

        this.emit('resize-done');
    }
}

Signals.addSignalMethods(AutoTileMainAndList.prototype);

function AutoTileTwoList(grid) {
    this._init(grid,"action-two-list");
}

AutoTileTwoList.prototype = {
    __proto__: ActionButton.prototype,

    _init : function(grid,classname) {
        ActionButton.prototype._init.call(this, grid, classname);
        this.classname = classname;
        this.connect('button-press-event',Lang.bind(this,this._onButtonPress));
    },

    _onButtonPress: function() {
        if (!focusMetaWindow) {
            return;
        }

        reset_window(focusMetaWindow);

        let monitor = this.grid.monitor;
        let workArea = getWorkArea(monitor);

        let windows = getNotFocusedWindowsOfMonitor(monitor);//getWindowsOfMonitor(monitor);

        let nbWindowOnEachSide = Math.ceil((windows.length + 1) / 2);
        let winHeight = workArea.height/nbWindowOnEachSide;

        let countWin = 0;

        move_resize_window_with_margins(
            focusMetaWindow,
            workArea.x + countWin%2 * workArea.width/2,
            workArea.y + (Math.floor(countWin/2) * winHeight),
            workArea.width/2,
            winHeight
        );

        countWin++;

        // todo make function
        for (let windowIdx in windows) {
            let metaWindow = windows[windowIdx].meta_window;

            reset_window(metaWindow);

            move_resize_window_with_margins(
                metaWindow,
                workArea.x + countWin%2 * workArea.width/2,
                workArea.y + (Math.floor(countWin/2) * winHeight),
                workArea.width/2,
                winHeight
            );
            countWin++;
        }

        this.emit('resize-done');
    }
}

Signals.addSignalMethods(AutoTileTwoList.prototype);

function ActionScale(grid) {
    this._init(grid,"action-scale");
}

ActionScale.prototype = {
    __proto__: ActionButton.prototype,

    _init: function(grid, classname) {
        ActionButton.prototype._init.call(this, grid, classname);
        this.classname = classname;
        this.connect('button-press-event',Lang.bind(this,this._onButtonPress));
    },

    _onButtonPress: function() {
        //global.log(this.classname + "pressed");
    }
}

function GridSettingsButton(text,cols,rows) {
    this._init(text,cols,rows);
}

GridSettingsButton.prototype = {
    _init: function(text, cols, rows) {
        this.cols = cols;
        this.rows = rows;
        this.text = text;

        this.actor = new St.Button({style_class: 'settings-button',
        reactive: true,
        can_focus:true,
        track_hover: true});

        this.label = new St.Label({style_class: 'settings-label', reactive:true, can_focus:true, track_hover:true, text:this.text});

        this.actor.add_actor(this.label);

        this.actor.connect('button-press-event', Lang.bind(this,this._onButtonPress));
    },

    _onButtonPress: function() {
        nbCols = this.cols;
        nbRows = this.rows;

        refreshGrids();
    }
};

function Grid(monitor_idx,screen,title,cols,rows) {
    this._init(monitor_idx,screen,title,cols,rows)
}

Grid.prototype = {
    _init: function(monitor_idx,monitor,title,cols,rows) {
        let workArea = getWorkArea(monitor);

        this.tableWidth = 320;
        this.tableHeight = (this.tableWidth / workArea.width) * workArea.height;
        this.borderwidth = 2;

        this.actor = new St.BoxLayout({ vertical:true,
            style_class: 'grid-panel',
            reactive:true,
            can_focus:true,
            track_hover:true
        });

        this.actor.connect('enter-event',Lang.bind(this,this._onMouseEnter));
        this.actor.connect('leave-event',Lang.bind(this,this._onMouseLeave));
        //this.actor.connect('key-press-event', Lang.bind(this, this._globalKeyPressEvent));

        this.topbar = new TopBar(title);

        this.bottombarContainer = new St.Bin({ style_class: 'bottom-box-container',
            reactive:true,
            can_focus:true,
            track_hover:true
        });

        this.bottombar = new St.Widget({
            style_class: 'bottom-box',
            can_focus: true,
            track_hover: true,
            reactive: true,
            width:this.tableWidth-20,
            height:36,
            layout_manager: new Clutter.TableLayout()
        });
        this.bottombar_table_layout = this.bottombar.layout_manager;

        this.bottombarContainer.add_actor(this.bottombar,{x_fill:true,y_fill:true})

        this.veryBottomBarContainer = new St.Bin({ style_class: 'very-bottom-box-container',
            reactive:true,
            can_focus:true,
            track_hover:true
        });

        this.veryBottomBar = new St.Widget({
            style_class: 'very-bottom-box',
            can_focus: true,
            track_hover: true,
            reactive: true,
            width:this.tableWidth-20,
            height:36,
            layout_manager: new Clutter.TableLayout()
        });
        this.veryBottomBar_table_layout = this.veryBottomBar.layout_manager;

        this.veryBottomBarContainer.add_actor(this.veryBottomBar,{x_fill:true,y_fill:true})

        let rowNum = 0;
        let colNum = 0;
        let maxPerRow = 4;

        let gridSettingsButton = gridSettings[SETTINGS_GRID_SIZE];

        for (var index=0; index<gridSettingsButton.length;index++) {
            if (colNum>= 4) {
                colNum = 0;
                rowNum += 2;
            }

            let button = gridSettingsButton[index];
            button = new GridSettingsButton(button.text,button.cols,button.rows);
            this.bottombar_table_layout.pack(button.actor, colNum, rowNum);
            button.actor.connect('notify::hover',Lang.bind(this,this._onSettingsButton));
            colNum++;
        }

        this.tableContainer = new  St.Bin({ style_class: 'table-container',
            reactive:true,
            can_focus:true,
            track_hover:true
        });

        this.table = new St.Widget({
            style_class: 'table',
            can_focus: true,
            track_hover: true,
            reactive: true,
            height:this.tableHeight,
            width:this.tableWidth-2,
            layout_manager: new Clutter.TableLayout()
        });
        this.table_table_layout = this.table.layout_manager;

        this.tableContainer.add_actor(this.table,{x_fill:true,y_fill:true})

        this.actor.add_actor(this.topbar.actor,{x_fill:true});
        this.actor.add_actor(this.tableContainer,{x_fill:true});
        this.actor.add_actor(this.bottombarContainer,{x_fill:true});
        this.actor.add_actor(this.veryBottomBarContainer,{x_fill:true});


        this.monitor = monitor;
        this.monitor_idx = monitor_idx;
        this.rows = rows;
        this.title = title;
        this.cols = cols;

        this.isEntered = false;

        if (true) {
            let nbTotalSettings = 4;

            if (!toggleSettingListener) {
                toggleSettingListener = new ToggleSettingsButtonListener();
            }

            let toggle = new ToggleSettingsButton("animation",SETTINGS_ANIMATION);
            this.veryBottomBar_table_layout.pack(toggle.actor, 0, 0);
            toggleSettingListener.addActor(toggle);

            toggle = new ToggleSettingsButton("auto-close",SETTINGS_AUTO_CLOSE);
            this.veryBottomBar_table_layout.pack(toggle.actor, 1, 0);
            toggleSettingListener.addActor(toggle);

            let action = new AutoTileMainAndList(this);
            this.veryBottomBar_table_layout.pack(action.actor, 2, 0);
            action.connect('resize-done', Lang.bind(this,this._onResize));

            action = new AutoTileTwoList(this);
            this.veryBottomBar_table_layout.pack(action.actor, 3, 0);
            action.connect('resize-done', Lang.bind(this,this._onResize));

            /*action = new ActionScale(this);
            action.actor.width = (this.tableWidth / nbTotalSettings) - this.borderwidth*2;
            this.veryBottomBar.add(action.actor,{row:0, col:4,x_fill:false,y_fill:false});   */
        }


        this.x = 0;
        this.y = 0;

        this.interceptHide = false;
        this._displayElements();

        this.normalScaleY = this.actor.scale_y;
        this.normalScaleX = this.actor.scale_x;
    },

    _displayElements: function() {
        this.elements = new Array();

        let width = (this.tableWidth / this.cols);// - 2*this.borderwidth;
        let height = (this.tableHeight / this.rows);// - 2*this.borderwidth;

        this.elementsDelegate = new GridElementDelegate();
        this.elementsDelegate.connect('resize-done', Lang.bind(this, this._onResize));
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (c == 0) {
                    this.elements[r] = new Array();
                }

                let element = new GridElement(this.monitor,width,height,c,r);

                this.elements[r][c] = element;
                element.actor._delegate = this.elementsDelegate;
                this.table_table_layout.pack(element.actor, c, r);
                element.show();
            }
        }
    },

    refresh: function() {
        this.table.destroy_all_children();
        this.cols = nbCols;
        this.rows = nbRows;
        this._displayElements();
    },

    set_position: function (x, y) {
        this.x = x;
        this.y = y;
        this.actor.set_position(x, y);
    },

    show: function() {
        this.interceptHide = true;
        this.elementsDelegate.reset();
        let time = (gridSettings[SETTINGS_ANIMATION]) ? 0.3 : 0 ;

        this.actor.raise_top();
        Main.layoutManager.removeChrome(this.actor);
        Main.layoutManager.addChrome(this.actor);
        //this.actor.y = 0 ;
        this.actor.scale_y= 0;
        //this.actor.scale_x= 0;
        if (time > 0 ) {
            Tweener.addTween(this.actor, {
                time: time,
                opacity: 255,
                visible: true,
                transition: 'easeOutQuad',
                scale_y: this.normalScaleY,
                onComplete: this._onShowComplete
            });
        }
        else {
            this.actor.opacity = 255;
            this.actor.visible = true;
            this.actor.scale_y = this.normalScaleY;
        }

        this.interceptHide = false;
    },

    hide: function(immediate) {
        this.elementsDelegate.reset();
        let time = (gridSettings[SETTINGS_ANIMATION] && !immediate) ? 0.3 : 0;
        //global.log(time);
        if (time > 0) {
            Tweener.addTween(this.actor, {
                time: time,
                opacity: 0,
                visible: false,
                scale_y:0,
                transition: 'easeOutQuad',
                onComplete: this._onHideComplete
            });
        }
        else {
            this.actor.opacity = 0;
            this.actor.visible = false;
            //this.actor.y = 0;
            this.actor.scale_y = 0;
        }
    },

    _onHideComplete: function() {
        if(!this.interceptHide && this.actor) {
            Main.layoutManager.removeChrome(this.actor);
        }
    },

    _onShowComplete: function() {

    },

    _onResize: function(actor, event) {
        //global.log('resize-done: '+actor);
        updateRegions();
        if (gridSettings[SETTINGS_AUTO_CLOSE]) {
            this.emit('hide-tiling');
        }
    },

    _onMouseEnter: function() {
        if (!this.isEntered) {
            this.elementsDelegate.reset();
            this.isEntered = true;
        }
    },

    _onMouseLeave: function() {
        let [x, y, mask] = global.get_pointer();
        if ( this.elementsDelegate && (x <= this.actor.x || x>= (this.actor.x+this.actor.width)) || (y <=this.actor.y || y >= (this.actor.y+this.height)) ) {
            this.isEntered = false;
            this.elementsDelegate.reset();
            refreshGrids();
        }
    },

    _globalKeyPressEvent: function(actor, event) {
        let symbol = event.get_key_symbol();
        //global.log("Escape pressed: "+symbol);
        if (symbol == Clutter.Escape) {
            hideTiling();
            launcher.reset();
            return true;
        }
        return false;
    },

    _onSettingsButton: function() {
        this.elementsDelegate.reset();
    },

    _destroy: function() {
        for (let r in this.elements) {
            for (let c in this.elements[r]) {
                this.elements[r][c]._destroy();
            }
        }

        this.elementsDelegate._destroy();
        this.topbar._destroy();

        this.monitor = null;
        this.rows = null;
        this.title = null;
        this.cols = null;
    }
};

Signals.addSignalMethods(Grid.prototype);

function GridElementDelegate(rows, cols, width, height) {
    this._init();
}

GridElementDelegate.prototype = {

    _init: function() {
        this.activated = false;
        this.first = false;
        this.last = false;
        this.currentElement = false;
        this.activatedActors=false;
    },

    _allSelected: function() {
        return (this.activatedActors.length == (nbCols * nbRows));
    },

    _onButtonPress: function(gridElement) {
        if (this.activated==false) {
            this.activated = true;
            gridElement.active = true;
            this.activatedActors= new Array();
            this.activatedActors.push(gridElement);
            this.first = gridElement;
        }
        else {
            //global.log("resize");
            //Check this.activatedActors if equals to nbCols * nbRows
            //before doing anything with the window it must be unmaximized
            //if so move the window then maximize instead of change size
            //if not move the window and change size

            reset_window(focusMetaWindow);

            //focusMetaWindow.move_anchor_point_from_gravity(Clutter.Gravity.CENTER);

            let areaWidth,areaHeight,areaX,areaY;
            [areaX,areaY,areaWidth,areaHeight] = this._computeAreaPositionSize(this.first,gridElement);

            if (this._allSelected()) {
                move_maximize_window(focusMetaWindow,areaX,areaY);
            }
            else {
                move_resize_window_with_margins(focusMetaWindow,areaX,areaY,areaWidth,areaHeight);
            }
            //focusMetaWindow.configure_notify();

            this._resizeDone();
        }
    },

    _resizeDone: function() {
        this.emit('resize-done');
    },

    reset: function() {
        this._resetGrid();

        this.activated = false;
        this.first = false;
        this.last = false;
        this.currentElement = false;
    },

    _resetGrid: function() {
        this._hideArea();
        if (this.currentElement) {
            this.currentElement._deactivate();
        }

        for (var act in this.activatedActors) {
            this.activatedActors[act]._deactivate();
        }
        this.activatedActors = new Array();
    },

    _getVarFromGridElement: function(fromGridElement, toGridElement) {
        let minX = Math.min(fromGridElement.coordx, toGridElement.coordx);
        let maxX = Math.max(fromGridElement.coordx, toGridElement.coordx);

        let minY = Math.min(fromGridElement.coordy, toGridElement.coordy);
        let maxY = Math.max(fromGridElement.coordy, toGridElement.coordy);

        return [minX,maxX,minY,maxY];
    },

    refreshGrid: function(fromGridElement, toGridElement) {
        this._resetGrid();
        let [minX,maxX,minY,maxY] = this._getVarFromGridElement(fromGridElement, toGridElement);

        let key = getMonitorKey(fromGridElement.monitor);
        let grid = grids[key];
        for (let r=minY; r <= maxY; r++) {
            for (let c=minX; c <= maxX; c++) {
                let element = grid.elements[r][c];
                element._activate();
                this.activatedActors.push(element);
            }
        }

        this._displayArea(fromGridElement, toGridElement);
    },

    _computeAreaPositionSize: function(fromGridElement, toGridElement) {
        let [minX,maxX,minY,maxY] = this._getVarFromGridElement(fromGridElement,toGridElement);

        let monitor = fromGridElement.monitor;
        let workArea = getWorkArea(monitor);

        let areaWidth = (workArea.width/nbCols)*((maxX-minX)+1);
        let areaHeight = (workArea.height/nbRows)*((maxY-minY)+1);

        let areaX = workArea.x + (minX*(workArea.width/nbCols));
        let areaY = workArea.y + (minY*(workArea.height/nbRows));

        return [areaX,areaY,areaWidth,areaHeight];
    },

    _displayArea: function(fromGridElement, toGridElement) {
        let areaWidth,areaHeight,areaX,areaY;
        [areaX,areaY,areaWidth,areaHeight] = this._computeAreaPositionSize(fromGridElement,toGridElement);

        area.add_style_pseudo_class('activate');

        if (gridSettings[SETTINGS_ANIMATION]) {
            Tweener.addTween(area, {
                time: 0.2,
                x:areaX,
                y:areaY,
                width:areaWidth,
                height: areaHeight,
                transition: 'easeOutQuad'
            });
        }
        else {
            area.width = areaWidth;
            area.height = areaHeight;
            area.x = areaX;
            area.y = areaY;
        }
    },

    _hideArea: function() {
        area.remove_style_pseudo_class('activate');
    },

    _onHoverChanged: function(gridElement) {
        if(this.activated) {
            this.refreshGrid(this.first,gridElement);
        }
        else if (!this.currentElement || gridElement.id != this.currentElement.id) {
            if (this.currentElement) {
                this.currentElement._deactivate();
            }

            this.currentElement = gridElement;
            this.currentElement._activate();
            this._displayArea(gridElement,gridElement);
        }
    },

    _destroy: function() {
        this.activated = null;
        this.first = null;
        this.last = null;
        this.currentElement = null;
        this.activatedActors=null;
    }
};

Signals.addSignalMethods(GridElementDelegate.prototype);

function GridElement(monitor, width, height, coordx, coordy) {
    this._init(monitor, width, height, coordx, coordy);
}

GridElement.prototype = {

    _init: function(monitor,width,height,coordx,coordy) {
        this.actor = new St.Button({style_class: 'table-element',reactive: true,can_focus:true,track_hover: true})

        this.actor.visible = false;
        this.actor.opacity = 0;
        this.monitor = monitor;
        this.coordx = coordx;
        this.coordy = coordy;
        this.width = width;
        this.height = height;

        this.id =  getMonitorKey(monitor)+":"+coordx+":"+coordy;

        this.actor.connect('button-press-event', Lang.bind(this, this._onButtonPress));
        this.actor.connect('notify::hover', Lang.bind(this, this._onHoverChanged));

        this.active = false;
    },

    show: function () {
        this.actor.opacity = 255;
        this.actor.visible = true;
    },

    hide: function () {
        this.actor.opacity = 0;
        this.actor.visible = false;
    },

    _onButtonPress: function() {
        global.log("onButtonPress "+this.id);
        this.actor._delegate._onButtonPress(this);
    },

    _onHoverChanged: function() {
        global.log("onHoverChanged "+this.id);
        this.actor._delegate._onHoverChanged(this);
    },

    _activate: function() {
        global.log("activate "+this.id);

        this.actor.add_style_pseudo_class('activate');
    },

    _deactivate: function() {
        global.log("deactivate "+this.id);
        this.actor.remove_style_pseudo_class('activate');
    },

    _clean: function() {
        Main.uiGroup.remove_actor(area);
    },

    _destroy: function() {
        this.monitor = null;
        this.coordx = null;
        this.coordy = null;
        this.width = null;
        this.height = null;

        this.active = null;
    }
};
