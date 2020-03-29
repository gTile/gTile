'use strict'
/* Logging
 * Written by Sergey
*/ 
var debug = false;

function log(log_string) {
    if(debug) {
        global.log("gTile " + log_string);
    }
}
