'use strict'

// Extension imports
const Utils = imports.misc.extensionUtils;

var settings;

function get() {
    if(!settings) {
        settings = Utils.getSettings('org.gnome.shell.extensions.gtile');
    }
    return settings;
}
