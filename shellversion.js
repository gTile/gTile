'use strict'
/* Determine if gnome-shell version newer than required
 * Written by Sergey
*/ 

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Log = Me.imports.logging;

const Config = imports.misc.config;

function ShellVersion() {
    this._init();
}

ShellVersion.prototype = {

    _init: function() {
        var split_version = Config.PACKAGE_VERSION.split(".");
        this.v_major = split_version[0];
        this.v_minor = split_version[1];
        this.version_34 = new Array(3, 34);
        this.version_36 = new Array(3, 36);
    },
    
    _version_at_least : function (version) {
        return version[0] <= this.v_major &&
            version[1] <= this.v_minor;
    },

    version_at_least_34 : function () {
        return this._version_at_least(this.version_34);	
    },

    version_at_least_36 : function () {
        return this._version_at_least(this.version_36);	
    },

    print_version : function () {
        Log.log("Init gnome-shell version " + Config.PACKAGE_VERSION + " major " + this.v_major + " minor " + this.v_minor);                      
    }
};
