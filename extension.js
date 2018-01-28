/*****************************************************************

  This extension has been developed by vibou

  With the help of the gnome-shell community

  Edited by Kvis for gnome 3.8
  Edited by Lundal for gnome 3.18
  Edited by Sergey to add keyboard shortcuts and prefs dialog

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
const Settings = Extension.imports.settings;
const hotkeys = Extension.imports.hotkeys;
const System = Extension.imports.compiled_typescript.System;


System.registry.set(
  System.resolveSync('appwrapper'),
  System.newModule({
      Clutter: Clutter,
      DND: DND,
      Lang: Lang,
      Main: Main,
      MessageTray: MessageTray,
      Meta: Meta,
      PanelMenu: PanelMenu,
      Shell: Shell,
      Signals: Signals,
      St: St,
      Tweener: Tweener,
      WindowManager: WindowManager,
      Workspace: Workspace,

      Settings: Settings,
      hotkeys: hotkeys
  }));

let appPromise = null;

function init() {
  appPromise = Promise.all(['app'].map(x => System.import(x)))
    .then(libs => libs[0])
    .catch(x => {
      logLoadError('problem loading libraries: '+ x);
      logLoadError('stack trace: ' + x.stack);
      throw x;
    });
}

function enable() {
  appPromise.then(app => app.enable())
    .catch(x => {
      logLoadError('problem loading app: '+ x);
      logLoadError('stack trace: ' + x.stack);
      throw x;
    });
}

function disable() {
  appPromise.then(app => app.disable())
    .catch(x => {
      logLoadError('problem loading app: '+ x);
      logLoadError('stack trace: ' + x.stack);
      throw x;
    });
}

function logLoadError(msg) {
  global.log("gTile: load error " + msg);
}
