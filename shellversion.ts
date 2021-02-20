/* Determine if gnome-shell version newer than required
 * Written by Sergey
*/

import {log} from './logging';

declare var imports: any;

interface ConfigObject {
    PACKAGE_VERSION: string;
}

function getConfig(): ConfigObject {
    return imports.misc.config;
}

interface Version {
    major: number;
    minor: number;
}

const VERSION_34: Version = {major:3, minor: 34};
const VERSION_36: Version = {major:3, minor: 36};

/**
 * ShellVersion is used to parse the version string
 */
export class ShellVersion {
    readonly major: number;
    readonly minor: number;
    private readonly rawVersion: string;
    
    private constructor(version: string) {
        const parts = version.split('.').map((part) => Number(part));
        if (parts.length < 2) {
            throw new Error(`invalid version supplied: ${version}`);
        }
        this.major = parts[0];
        this.minor = parts[1];
        // Tolerate "40.alpha.1" for example. See https://github.com/gTile/gTile/issues/187.
        if (isNaN(this.minor)) {
            this.minor = 0;
        }
        if (isNaN(this.major)) {
            throw new Error(`invalid version supplied: ${JSON.stringify(version)}; got major = ${this.major}, minor = ${this.minor}`);
        }
        this.rawVersion = version;
    }

    public static defaultVersion(): ShellVersion {
        return ShellVersion.parse(getConfig().PACKAGE_VERSION);
    }

    public static parse(version: string): ShellVersion {
        return new ShellVersion(version);
    }

    version_at_least_34(): boolean {
        return versionGreaterThanOrEqualTo(this, VERSION_34);
    }

    version_at_least_36(): boolean {
        return versionGreaterThanOrEqualTo(this, VERSION_36);
    }

    print_version  () {
        log("Init gnome-shell version " + this.rawVersion + " major " + this.major + " minor " + this.minor);
    }
};

/**
 * Returns true if a is >= b.
 */
function versionGreaterThanOrEqualTo(a: Version, b: Version): boolean {
    return a.major > b.major || (a.major === b.major && a.minor >= b.minor);
}
