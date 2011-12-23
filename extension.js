/*****************************************************************

             This extension has been developped by
                            vibou
                                
           With the help of the gnome-shell community

******************************************************************/

/*****************************************************************
                         CONST & VARS
*****************************************************************/
const St = imports.gi.St;
const Main = imports.ui.main;
const Shell = imports.gi.Shell;
const WindowManager = imports.ui.windowManager;
const Lang = imports.lang;
const PanelMenu = imports.ui.panelMenu;
const DND = imports.ui.dnd;
const Meta = imports.gi.Meta;
const Clutter = imports.gi.Clutter;
const Signals = imports.signals;
const Tweener = imports.ui.tweener;

const SETTINGS_GRID_SIZE = 'grid-size';
const SETTINGS_AUTO_CLOSE = 'auto-close';
const SETTINGS_ANIMATION = 'animation';
/*COMMING SOON*/
//const SETTINGS_KEY_BINDING = 'key-binding';

let status;
let launcher;
let grids;
let monitors;
let tracker;
let nbCols;
let nbRows;
let area;
let focusMetaWindow = false;
let focusMetaWindowConnections = new Array();
let focusMetaWindowPrivateConnections = new Array();
let tracker;
let gridSettings = new Object();
let toggleSettingListener;


/*****************************************************************
                            SETTINGS
*****************************************************************/
/*INIT SETTINGS HERE TO ADD OR REMOVE SETTINGS BUTTON*/
/*new GridSettingsButton(LABEL, NBCOL, NBROW) */
function initSettings()
{
    //Here is where you add new grid size button
    gridSettings[SETTINGS_GRID_SIZE] = [
        new GridSettingsButton('2x2',2,2),
        new GridSettingsButton('3x2',3,2),
        new GridSettingsButton('4x4',4,4),
        new GridSettingsButton('6x6',6,6),
    ];
    
    //myCustomButton = new GridSettingsButton('Custom',8,8); //Going to be a 8x8 GridSettings
    //gridSettings[SETTINGS_GRID_SIZE].push(myCustomButton);
    
     //You can change those settings to set whatever you want by default
     gridSettings[SETTINGS_AUTO_CLOSE] = false;
     gridSettings[SETTINGS_ANIMATION] = true;

     // Key Binding to Toggle the Window
     // uncomment this, and set the following command to set the keybinding:
     //Main.wm.setKeybindingHandler('run_command_9', toggleTiling);
     
     /**
     Use the following command to set the keybinding:
     
     % gconftool-2 -s --type string "/apps/metacity/global_keybindings/run_command_9" 'F12'
     
     Change the run_command_ to a number that is not used in your Custom Keybindings  (1-9)
     **/

}


/*****************************************************************
                            FUNCTIONS
*****************************************************************/


function enable() {
    status = false;
    monitors = Main.layoutManager.monitors;
    tracker = Shell.WindowTracker.get_default();
    tracker.connect('notify::focus-app', Lang.bind(this, this._onFocus));

    nbCols = 4;
    nbRows = 4;

    area = new St.BoxLayout({style_class: 'grid-preview'});
    launcher = new GTileButton('tiling-icon');
    
    initSettings();
    initGrids(); 

	Main.panel._rightBox.insert_actor(launcher.actor, 0);
}

function resetFocusMetaWindow()
{
    if(focusMetaWindowConnections.length>0)
    {
        for(var idx in focusMetaWindowConnections)
        {
            focusMetaWindow.disconnect(focusMetaWindowConnections[idx]);
        }
    }
    
    if(focusMetaWindowPrivateConnections.length>0)
    {
        let actor = focusMetaWindow.get_compositor_private();
        for(var idx in focusMetaWindowPrivateConnections)
        {
             actor.disconnect(focusMetaWindowPrivateConnections[idx]);
        }
    }
    
    focusMetaWindow = false;
    focusMetaWindowConnections = new Array();
    focusMetaWindowPrivateConnections = new Array();
}

function disable() 
{
    destroyGrids();
    Main.panel._rightBox.remove_actor(launcher.actor);
    resetFocusMetaWindow();
    
}

function initGrids()
{
	grids = new Array();
	for(monitorIdx in monitors)
	{
		let monitor = monitors[monitorIdx];
		let grid = new Grid(monitorIdx,monitor,"gTile", nbCols, nbRows);
		let key = getMonitorKey(monitor);
		grids[key] = grid;
		grid.actor.set_opacity(0);
		Main.layoutManager.addChrome(grid.actor, { visibleInFullscreen: true });
		grid.hide(true);
	}
}

function destroyGrids()
{
    for(monitorIdx in monitors)
	{
		let monitor = monitors[monitorIdx];
		let key = getMonitorKey(monitor);
		grid = grids[key];
		grid.hide(true);
		Main.layoutManager.removeChrome(grid.actor);
	}
}

function _moveGrids()
{
    let window = focusMetaWindow;
    if(window)
    {
        for(var gridIdx in grids)
        {
            let grid = grids[gridIdx];
            let pos_x;
	        let pos_y;
	        global.log("grid"+grid);
	        let monitor = grid.monitor;
	        if(window.get_monitor() == grid.monitor_idx)
	        {
	            pos_x = window.get_outer_rect().width / 2  + window.get_outer_rect().x;
	            pos_y = window.get_outer_rect().height / 2  + window.get_outer_rect().y;
	        }
	        else
	        {
	            pos_x =monitor.x + monitor.width/2;
	            pos_y = monitor.y + monitor.height/2;
	        }        
	        
	        pos_x = Math.floor(pos_x - grid.actor.width / 2);
	        pos_y = Math.floor(pos_y - grid.actor.height / 2);
	        
	        if(gridSettings[SETTINGS_ANIMATION])
	        {
	            let time = 0.5 ;
	            Tweener.addTween(grid.actor,
                         { 
                           time: time,
                           x:pos_x,
                           y:pos_y,
                           transition: 'easeOutQuad',
                           onComplete: _updateChrome,
                           onCompleteScope: this.actor});
	        }
	        else
	        {
	            grid.set_position(
	                pos_x, 
	               pos_y
                );
	        }
	        
        }
    }
}

function  _updateChrome()
{
     Main.layoutManager._chrome.updateRegions();
}

function _onFocus()
{
    let window = getFocusApp();
    if(window)
    {   
        resetFocusMetaWindow();

        //global.log("Connect window: "+window.get_title());
        focusMetaWindow = window;
        focusMetaWindowConnections.push(focusMetaWindow.connect('notify::title',Lang.bind(this,this._onFocus)));
        
        let actor = focusMetaWindow.get_compositor_private();
        focusMetaWindowPrivateConnections.push(actor.connect('size-changed',Lang.bind(this,this._moveGrids)));
        focusMetaWindowPrivateConnections.push(actor.connect('position-changed',Lang.bind(this,this._moveGrids)));
       
        //global.log("End Connect window: "+window.get_title());

        let app = tracker.get_window_app(focusMetaWindow);
        let title = focusMetaWindow.get_title();
        
        
        for(monitorIdx in monitors)
	    {
		    let monitor = monitors[monitorIdx];
		    let key = getMonitorKey(monitor);
		    let grid = grids[key];
		    if(app)
		        grid.topbar._set_app(app,title);
            else
                grid.topbar._set_title(title);
	    }
	    
	    _moveGrids();
    }
    else
    {
        resetFocusMetaWindow();
        for(var gridIdx in grids)
        {
            let grid = grids[gridIdx];
            grid.topbar._set_title('gTile');
        }
        
    }
}



function showTiling(immediate)
{
    focusMetaWindow = getFocusApp();
    let wm_class = focusMetaWindow.get_wm_class();
    let wm_type = focusMetaWindow.get_window_type();
    let layer = focusMetaWindow.get_layer();
        
    //global.log("type:"+wm_type+" class:"+wm_class+" layer:"+layer);
    //global.log("focus app: "+focusMetaWindow);
    
	if(focusMetaWindow && wm_type != 1 && layer > 0)
	{	    
	    Main.uiGroup.add_actor(area);
	    for(monitorIdx in monitors)
	    {
	        let monitor = monitors[monitorIdx];
	        let key = getMonitorKey(monitor);
	        let grid = grids[key];
	        //global.log("ancestor: "+grid.actor.get_parent());
	        
	        let window = getFocusApp();
	        let pos_x;
	        let pos_y;
	        if(window.get_monitor() == monitorIdx)
	        {
	            pos_x = window.get_outer_rect().width / 2  + window.get_outer_rect().x;
	            pos_y = window.get_outer_rect().height / 2  + window.get_outer_rect().y;
	        }
	        else
	        {
	            pos_x =monitor.x + monitor.width/2;
	            pos_y = monitor.y + monitor.height/2;
	        }        
	        
	        grid.set_position(
	            Math.floor(pos_x - grid.actor.width / 2), 
	            Math.floor(pos_y - grid.actor.height / 2)
            );
                    
            grid.show(immediate); 
	    }
	    
	    this._onFocus();
		status = true;
	}
}

function hideTiling(immediate)
{	
	for(let gridIdx in grids)
	{
	    let grid = grids[gridIdx];
	    grid.hide(immediate);
	}
	
	Main.uiGroup.remove_actor(this.area);
	
    resetFocusMetaWindow();
    
    launcher.reset();
    status = false;
}

function toggleTiling()
{
	if(status)
	{		
		hideTiling();
	}
	else
	{
		showTiling();
	}
	return status;
}


function getMonitorKey(monitor)
{
    return monitor.x+":"+monitor.width+":"+monitor.y+":"+monitor.height;
}

function getFocusApp()
{ 
    let windows = global.screen.get_active_workspace().list_windows();
    for ( let i = 0; i < windows.length; ++i ) 
    {
            let metaWindow = windows[i];
            if(metaWindow.has_focus())
            {
                return metaWindow;
            }
    }
    return false;
}

function isPrimaryMonitor(monitor)
{
    return Main.layoutManager.primaryMonitor == monitor;
}

/*****************************************************************
                            PROTOTYPES
*****************************************************************/

function TopBar(title)
{
    this._init(title);
}

TopBar.prototype = {
      
    _init: function(title) {
   	this.actor = new St.BoxLayout({style_class:'top-box'});
        this._title = title;
        this._stlabel =  new St.Label({style_class: 'grid-title',text: this._title});
        this._iconBin = new St.Bin({ x_fill: false, y_fill: true });
        this._closebutton = new GTileButton('close-button');
        
        this.actor.add(this._iconBin);
        this.actor.add(this._stlabel,{x_fill: true,expand: true});
        this.actor.add(this._closebutton.actor,{x_fill: false,expand: false});
    },
    
    _set_title : function(title)
    {
         this._title = title;
         this._stlabel.text = this._title;
    },
    
    _set_app : function(app,title)
    {
       
         this._title = app.get_name()+" - "+title;
          //global.log("title: "+this._title);
         this._stlabel.text = this._title;
         this._icon = app.create_icon_texture(24);
         
         this._iconBin.set_size(24, 24);
         this._iconBin.child = this._icon;
    },
};

function ToggleSettingsButtonListener()
{
    this._init();
};

ToggleSettingsButtonListener.prototype = {
    _init : function()
    {
        this.actors = new Array();
    },
    
    addActor : function(actor)
    {
        actor.connect('update-toggle', Lang.bind(this,this._updateToggle));
        this.actors.push(actor);
    },
    
    _updateToggle: function()
    {
        for(let actorIdx in this.actors)
        {
            let actor = this.actors[actorIdx];
            actor._update();
        }
    }
};

function ToggleSettingsButton(text,property)
{
    this._init(text,property);
    
};

ToggleSettingsButton.prototype = {
    _init : function(text,property)
    {
        this.text = text;
        this.actor = new St.Button({style_class: 'settings-button',
                                                  reactive: true,
                                                  can_focus:true,
                                                  track_hover: true});
        this.label = new St.Label({style_class: 'settings-label', reactive:true, can_focus:true, track_hover:true, text:this.text});
        this.property = property;
        this._update();
        this.actor.add_actor(this.label);
        this.actor.connect('button-press-event', Lang.bind(this,this._onButtonPress));
        this.connect('update-toggle', Lang.bind(this,this._update))
    },
    
    _update : function()
    {
        if(gridSettings[this.property])
        {
            this.actor.add_style_pseudo_class('activate');
        }
        else
        {
            this.actor.remove_style_pseudo_class('activate');
        }
    },
    
     _onButtonPress : function()
    {
        gridSettings[this.property] = !gridSettings[this.property];
        //global.log(this.property+": "+gridSettings[this.property]);
        this.emit('update-toggle');
    }
};

Signals.addSignalMethods(ToggleSettingsButton.prototype);

function GridSettingsButton(text,cols,rows)
{
    this._init(text,cols,rows);
}

GridSettingsButton.prototype = {
    _init : function(text,cols,rows)
    {
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
    
    _onButtonPress : function()
    {
        nbCols = this.cols;
        nbRows = this.rows;
        
        destroyGrids();
        initGrids();
        showTiling(true);
    },
};

function Grid(monitor_idx,screen,title,cols,rows)
{
	this._init(monitor_idx,screen,title,cols,rows)
}

Grid.prototype = {

	_init: function(monitor_idx,monitor,title,cols,rows) {

       	let tableWidth	= 220;
		let tableHeight = 200;
		let borderwidth = 2;

		this.actor = new St.BoxLayout({ vertical:true, 
		                                style_class: 'grid-panel',
		                                reactive:true,
		                                can_focus:true,
		                                track_hover:true});
		
		this.actor.connect('leave-event',Lang.bind(this,this._onMouseLeave));
		this.actor.connect('key-press-event', Lang.bind(this, this._globalKeyPressEvent));
		
		this.topbar = new TopBar(title);
		
		this.bottombar = new St.Table({ homogeneous: true,
                                    style_class: 'bottom-box',
                                    can_focus: true,
                                    track_hover: true,
                                    reactive: true,
                                    width:tableWidth,
                                    });
        
        this.veryBottomBar = new St.Table({ homogeneous: true,
                                    style_class: 'bottom-box',
                                    can_focus: true,
                                    track_hover: true,
                                    reactive: true,
                                    width:tableWidth,
                                    });
                                    
		let rowNum = 0;
		let colNum = 0;
		let maxPerRow = 4;
		let gridSettingsButton = gridSettings[SETTINGS_GRID_SIZE];
		
		for(var index=0; index<gridSettingsButton.length;index++)
		{
		    if(colNum>= 4)
		    {
		        colNum = 0;
		        rowNum += 2;
		    }
		    
		    let button = gridSettingsButton[index];
		    button = new GridSettingsButton(button.text,button.cols,button.rows);
		    this.bottombar.add(button.actor,{row:rowNum, col:colNum,x_fill:false,y_fill:false});
		    button.actor.connect('notify::hover',Lang.bind(this,this._onSettingsButton));
		    colNum++;
		}		
		
		this.table = new St.Table({ homogeneous: true,
                                    style_class: 'table',
                                    can_focus: true,
                                    track_hover: true,
                                    reactive: true,
                                    width:tableWidth,
                                    height:tableHeight
                                    });  
                                    
		this.actor.add(this.topbar.actor,{x_fill:true});
		this.actor.add(this.table,{x_fill:false});
		this.actor.add(this.bottombar,{x_fill:true});		
		this.actor.add(this.veryBottomBar,{x_fill:true});
		
				
		this.monitor = monitor;
		this.monitor_idx = monitor_idx;
		this.rows = rows;
		this.title = title;
		this.cols = cols;
		
		if(true)
		{
		    let nbTotalSettings = 2;
		
		    if(!toggleSettingListener)
		    {
		        toggleSettingListener = new ToggleSettingsButtonListener();
            }
            
		    let toggle = new ToggleSettingsButton("animation",SETTINGS_ANIMATION);
		    toggle.actor.width = (tableWidth / nbTotalSettings) - borderwidth*2;
		    this.veryBottomBar.add(toggle.actor,{row:0, col:0,x_fill:false,y_fill:false});
            toggleSettingListener.addActor(toggle);
            
		    toggle = new ToggleSettingsButton("auto-close",SETTINGS_AUTO_CLOSE);
		    toggle.actor.width = (tableWidth / nbTotalSettings) - borderwidth*2;
		    this.veryBottomBar.add(toggle.actor,{row:0, col:1,x_fill:false,y_fill:false});
            toggleSettingListener.addActor(toggle);
		}
		
		
		this.x = 0;
	    this.y = 0;
		
		this.elements = new Array();
		
		let width = (tableWidth / cols) - 2*borderwidth;
		let height = (tableHeight / rows) - 2*borderwidth;
	    
	   	this.elementsDelegate = new GridElementDelegate();
	   	this.elementsDelegate.connect('resize-done', Lang.bind(this, this._onResize));
		for(let r = 0; r < rows; r++)
		{
			for(let c = 0; c < cols; c++)
			{
                if(c == 0)
                {
	                this.elements[r] = new Array();					
                }

                let element = new GridElement(monitor,width,height,c,r);

                this.elements[r][c] = element;
                element.actor._delegate = this.elementsDelegate;
                this.table.add(element.actor,{row: r, col: c,x_fill:false, y_fill:false});
			}
		}		
	},
	
	set_position : function (x,y)
	{
	    this.x = x;
	    this.y = y;
	    this.actor.set_position(x,y);
	},
	
	show : function(immediate)
	{
	    let time = (gridSettings[SETTINGS_ANIMATION] && !immediate) ? 0.5 : 0.2 ;
	     //global.log(time);
        //this.actor.show();
        //this.actor.opacity = 255;
        this.actor.raise_top();
        Tweener.addTween(this.actor,
                         { 
                           time: time,
                           opacity: 255,
                           visible: true,
                           transition: 'easeOutQuad',
                           onComplete: this._updateChrome,
                           onCompleteScope: this.actor});
        
	},
	
	hide : function(immediate)
	{
	    let time = (gridSettings[SETTINGS_ANIMATION] && !immediate) ? 0.5 : 0.2 ;
	    //global.log(time);
	    Tweener.addTween(this.actor,
                         { 
                           time: time,
                           opacity: 0,
                           visible: false,
                           transition: 'easeOutQuad',
                           onComplete: this._updateChrome,
                           onCompleteScope: this.actor});
	},
	
	_updateChrome : function()
	{
	    if(this.elementsDelegate)
	    {
	        this.elementsDelegate._reset();
	    }
	    
	    Main.layoutManager._chrome.updateRegions();
	},
	
	 _onResize: function(actor, event)
	 {
        if(gridSettings[SETTINGS_AUTO_CLOSE])
        {
            hideTiling();
        }
     },
   
	
	_onMouseLeave : function()
	{
	    let [x, y, mask] = global.get_pointer();
	    if( this.elementsDelegate && (x< this.actor.x || x> (this.actor.x+this.actor.width)) || (y <this.actor.y || y > (this.actor.y+this.height)) )
	    {
	        this.elementsDelegate._reset();
	    }
	},
	
	_globalKeyPressEvent : function(actor, event) {
        let symbol = event.get_key_symbol();
        //global.log("Escape pressed: "+symbol);
        if (symbol == Clutter.Escape) {
            
            hideTiling();    
            launcher.reset();
            return true; 
        }
        return false;
    },
	
	_onSettingsButton : function()
	{
        this.elementsDelegate._reset();   
	},
	
	_destroy : function()
	{
	    for(let r in this.elements)
	    {
	        for(let c in this.elements[r])
	        {
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

function GridElementDelegate(rows,cols,width,height)
{
    this._init();
}

GridElementDelegate.prototype = {

    _init : function()
    {
        this.activated = false;
        this.first = false;
        this.last = false;
        this.currentElement = false;
        this.activatedActors=false;
    },
    
    _allSelected : function()
    {
        return (this.activatedActors.length == (nbCols * nbRows));
    },
    
    _onButtonPress : function(gridElement)
	{
	    if(this.activated==false)
	    {
	         this.activated = true;
	         this.activatedActors= new Array();
	         this.activatedActors.push(gridElement);
	         this.first = gridElement;
	         gridElement.actor.add_style_pseudo_class('activate');
	         gridElement.active = true;
	    }
	    else
	    {
	        //global.log("resize");
	        //Check this.activatedActors if equals to nbCols * nbRows
	        //before doing anything with the window it must be unmaximized
	        //if so move the window then maximize instead of change size
	        //if not move the window and change size
            let areaWidth,areaHeight,areaX,areaY;
            [areaX,areaY,areaWidth,areaHeight] = this._computeAreaPositionSize(this.first,gridElement);
            let borderX,borderY,vBorderX,vBorderY;
            [borderX,borderY] = this._getInvisibleBorderPadding(focusMetaWindow);
            [vBorderX,vBorderY] = this._getVisibleBorderPadding(focusMetaWindow);

           
            focusMetaWindow.unmaximize(Meta.MaximizeFlags.HORIZONTAL | Meta.MaximizeFlags.VERTICAL); 
            
            focusMetaWindow.move_frame(true,areaX-borderX,areaY-borderY);
            if(this._allSelected())
            {
                focusMetaWindow.maximize(Meta.MaximizeFlags.HORIZONTAL | Meta.MaximizeFlags.VERTICAL);
            }
            else
            {
                       
                focusMetaWindow.resize(true,areaWidth-vBorderX,areaHeight-vBorderY);
            }
            
                        
            //focusMetaWindow.configure_notify();
            
            this._reset();          
            this._resizeDone();
	    }
	},
	
	_resizeDone: function()
	{
	    this.emit('resize-done');
	},
	
	_reset: function()
	{
        this.resetGrid();
        
        this.activated = false;
        this.first = false;
        this.last = false;
        this.currentElement = false;
	},
	
	resetGrid: function()
	{
	    this._hideArea();
	    if(this.currentElement)
	    {
	        this.currentElement._deactivate();
	    }

        for(var act in this.activatedActors)
        {
           this.activatedActors[act]._deactivate();
        }
        this.activatedActors= new Array();
	},
	
	_getVarFromGridElement: function(fromGridElement, toGridElement)
	{
        let maxX = (fromGridElement.coordx >= toGridElement.coordx) ? fromGridElement.coordx : toGridElement.coordx;
        let minX = (fromGridElement.coordx <= toGridElement.coordx) ? fromGridElement.coordx : toGridElement.coordx;

        let maxY = (fromGridElement.coordy >= toGridElement.coordy) ? fromGridElement.coordy : toGridElement.coordy;
        let minY = (fromGridElement.coordy <= toGridElement.coordy) ? fromGridElement.coordy : toGridElement.coordy;

        return [minX,maxX,minY,maxY];
	},
	
	refreshGrid : function(fromGridElement,toGridElement)
	{
	     this.resetGrid();
	     let minX,maxX,minY,maxY;
	     [minX,maxX,minY,maxY] = this._getVarFromGridElement(fromGridElement,toGridElement);
	     
	     let key = getMonitorKey(fromGridElement.monitor);
	     let grid = grids[key];
	     for(let r=minY; r <= maxY; r++)
	     {
	        for(let c=minX; c <= maxX; c++)
	        {
	            let element = grid.elements[r][c];	            
	            element._activate();
	            this.activatedActors.push(element);
	        }
	     }
	     
	     this._displayArea(fromGridElement,toGridElement);
	},
	
	_getInvisibleBorderPadding: function(metaWindow) {
        let outerRect = metaWindow.get_outer_rect();
        let inputRect = metaWindow.get_input_rect();
        let [borderX, borderY] = [outerRect.x - inputRect.x,
                                  outerRect.y - inputRect.y];

        return [borderX, borderY];
    },
    
    _getVisibleBorderPadding: function(metaWindow) {
        let clientRect = metaWindow.get_rect();
        let outerRect = metaWindow.get_outer_rect();

        let borderX = outerRect.width - clientRect.width
        let borderY = outerRect.height - clientRect.height;

        return [borderX, borderY];
    },
	
	_computeAreaPositionSize : function (fromGridElement,toGridElement)
	{
	    let minX,maxX,minY,maxY;
	    [minX,maxX,minY,maxY] = this._getVarFromGridElement(fromGridElement,toGridElement);
	    
	    let monitor = fromGridElement.monitor;
	    
	    let offsetY = (isPrimaryMonitor(monitor)) ? Main.panel.actor.height : 0;
	    
	    let areaWidth = (monitor.width/nbCols)*((maxX-minX)+1);
		let areaHeight = ((monitor.height-offsetY)/nbRows)*((maxY-minY)+1);
		let areaX = monitor.x + (minX*(monitor.width/nbCols));
		let areaY = offsetY+monitor.y + (minY*((monitor.height-offsetY)/nbRows));
		
		return [areaX,areaY,areaWidth,areaHeight];
	},
	
	_displayArea : function (fromGridElement, toGridElement)
	{
	    let areaWidth,areaHeight,areaX,areaY;
	    [areaX,areaY,areaWidth,areaHeight] = this._computeAreaPositionSize(fromGridElement,toGridElement);
		
		area.add_style_pseudo_class('activate');
		
		area.width = areaWidth;
		area.height = areaHeight;
		area.x = areaX;
		area.y = areaY;
	},
	
	_hideArea : function()
	{
	    area.remove_style_pseudo_class('activate');
	},
	
	_onHoverChanged : function(gridElement)
	{
	    if(this.activated)
	    {
	         this.refreshGrid(this.first,gridElement);
	    }
	    else
	    {
	        if(this.currentElement)
	            this.currentElement._deactivate();
	        
	        this.currentElement = gridElement;
	        this._displayArea(this.currentElement,this.currentElement);
	        this.currentElement._activate();
	    }
	},
	
	_destroy : function()
	{
	    this.activated = null;
        this.first = null;
        this.last = null;
        this.currentElement = null;
        this.activatedActors=null;
	}
};

Signals.addSignalMethods(GridElementDelegate.prototype);

function GridElement(monitor,width,height,coordx,coordy)
{
	this._init(monitor,width,height,coordx,coordy);
}


GridElement.prototype = {
     
	_init: function(monitor,width,height,coordx,coordy) {
        this.actor = new St.Button({style_class: 'table-element',
                                                  width: width,
                                                  height: height,reactive: true,can_focus:true,track_hover: true})
		this.monitor = monitor;
		this.coordx = coordx;
		this.coordy = coordy;
		this.width = width;
		this.height = height;
		
		this.actor.connect('button-press-event', Lang.bind(this, this._onButtonPress));
		this.actor.connect('notify::hover', Lang.bind(this, this._onHoverChanged));
		
		this.active = false;	
	},
	
	_onButtonPress : function()
	{
	   this.actor._delegate._onButtonPress(this);
	},
	
	_onHoverChanged : function()
	{
	    this.actor._delegate._onHoverChanged(this);
	},
	
	_activate: function()
	{
	   this.actor.add_style_pseudo_class('activate');
	},
	
	_deactivate: function()
	{
	    this.actor.remove_style_pseudo_class('activate');
	},
	
	_clean : function()
	{
	    Main.uiGroup.remove_actor(this.area);
	},
	
	_destroy : function()
	{
		this.monitor = null;
		this.coordx = null;
		this.coordy = null;
		this.width = null;
		this.height = null;
		
		this.active = null;	
	}
	
};

function GTileButton(classname)
{
    this._init(classname);
}

GTileButton.prototype = {
    __proto__: PanelMenu.ButtonBox.prototype,
   
   _init : function(classname){
         PanelMenu.ButtonBox.prototype._init.call(this, { reactive: true,
                                               can_focus: true,
                                               track_hover: true,
                                               style_class: classname});
                                               
        this.actor.connect('button-press-event', Lang.bind(this, this._onButtonPress));
        
        
        this.activated = false;
   },
   
   reset : function()
   {
        this.activated = false;
        launcher.actor.remove_style_pseudo_class('activate');
   },
   
   _onButtonPress: function(actor, event){
        //global.log(this.activated);
        this.activated = toggleTiling();
        //global.log(this.activated);
        if(this.activated)
        {
            launcher.actor.add_style_pseudo_class('activate');
        }
        else
        {
            launcher.actor.remove_style_pseudo_class('activate');
        }
   },
   
    
   
   _destroy : function()
	{
	    this.activated = null;
	}
};

function init()
{
    
}
