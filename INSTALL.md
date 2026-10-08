# Install gTile on GNOME 51

This checkout targets **GNOME Shell 51**. The extension UUID remains
`gTile@vibou`, so upgrading preserves your existing gTile settings.
Use the older release for GNOME 49 or 50.

## Install the prepared archive

Check your desktop version:

```sh
gnome-shell --version
```

It must report `GNOME Shell 51.x`. Save `gtile.dist.zip` from this build to
your Downloads directory, then run as your normal desktop user:

```sh
gnome-extensions install --force ~/Downloads/gtile.dist.zip
```

Log out and log back in, then enable the extension:

```sh
gnome-extensions enable gTile@vibou
gnome-extensions info gTile@vibou
gnome-extensions prefs gTile@vibou
```

Focus a normal application window and press **Super+Enter**, or click the
gTile panel icon. Click two corners of the grid to tile the window. The panel
icon also supports Return and Space when reached through keyboard navigation.
While the overlay is open, Return confirms tiling and Space changes grid size.

Installation needs neither Node.js nor administrator privileges. The GNOME
installer compiles the bundled GSettings schema automatically.

## Build from this updated checkout

Use Node.js **24.12 or newer within the 24.x series**, npm, Git, `zip`, and
GNU `tar`. On Debian/Ubuntu, `zip` is available through `sudo apt install zip`.
Run these commands from the root of this updated checkout:

```sh
npm ci
npm run check
npm test
npm run build:dist
npm run install:extension
```

The build stages files under `out/extension/` and produces `gtile.dist.zip`
and `gtile.dist.tgz`. It excludes tests, npm dependencies, type declarations,
and stale JavaScript files from earlier builds. After installing, log out and
log back in before enabling gTile as described above.

## Desktop validation and troubleshooting

Check mouse selection, Super+Enter, resize presets, autotiling, full-grid
maximization, and the preferences dialog. With more than one display, check
moving windows between monitors and disconnecting/reconnecting a monitor.
Disable and enable the extension several times to check that overlays and
shortcuts do not accumulate. Check fractional scaling on your actual hardware.

If gTile fails to load, inspect:

```sh
gnome-extensions info gTile@vibou
journalctl --user -b -o cat | rg 'gTile|GTile'
```

To disable this build:

```sh
gnome-extensions disable gTile@vibou
```

To roll back, install the archive of your previous compatible release with
`gnome-extensions install --force`, then log out and log back in.

## Automated GNOME 51 integration test

In a disposable Linux machine/container with GNOME Shell 51, its preferences
runtime, GJS, GTK 4, libadwaita, D-Bus, and Python 3 installed, build the archive
and run:

```sh
bash scripts/gnome51-smoke/run.sh
```

The runner isolates user settings and extension installation under a temporary
XDG directory. It starts a headless Wayland compositor with two virtual monitors
and a real GTK window. Results and logs are written to
`/tmp/gtile-smoke-results.json` and `/tmp/gtile-smoke-shell.log`.
The system D-Bus must be running. A container without logind must not advertise
an active systemd seat. This harness does not enable Shell's unsafe D-Bus Eval.

Headless checks do not replace physical monitor hotplug, fractional scaling,
touchscreen, or GPU testing on your own desktop.
