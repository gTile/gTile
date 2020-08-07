/* Logging
 * Written by Sergey
*/ 

let debug: boolean = false;

declare const global: {
    log(message: string): void
};

/**
 * If called with a false argument, log statements are suppressed.
 */
export function setLoggingEnabled(enabled: boolean): void {
    debug = enabled;
}

/**
 * Log logs the given message using the gnome shell logger (global.log) if the
 * debug variable is set to true.
 *
 * Debug messages may be viewed using the bash command `journalctl
 * /usr/bin/gnome-shell` and grepping the results for 'gTile'.
 */
export function log(message: string): void {
    if(debug) {
        global.log("gTile " + message);
    }
}
