# GNOME 51 port validation

Validated on 8 October 2026:

- Node 24.19.0, TypeScript 6.0.3, AVA 8.0.1, @ava/typescript 7.0.0.
- Frozen dependency installation with `npm ci` and type checking with
  `npm run check`.
- All **17 AVA tests** passed, including settings limits, numeric validation,
  full-input parsing, resource cleanup, and preset expiration.
- `npm run build:dist` produced an installable ZIP and TAR archive. Archive
  contents and ZIP integrity were checked; development dependencies, tests,
  and type declarations were excluded.
- The ZIP installed with GNOME's installer, which compiled the included schema.
- All **19 integration checks** passed in a disposable Ubuntu 26.10 container
  running GNOME Shell/Mutter 51.0, GJS 1.90.0, and GLib 2.90.0.

The integration harness uses a real Wayland GTK window and two virtual monitors.
It verifies pointer and keyboard controllers, Super+Enter, plain window titles,
monitor-change notifications, quarter-screen tiling, monitor scaling, movement
between monitors, maximization, autotiling, three disable/enable cycles, and the
preferences window with custom shortcut markup. The final run had no gTile
disposed-object warnings or JavaScript errors. Missing optional system services
in the container produce unrelated GNOME Shell log messages.

These tests use software rendering. Physical GPU behavior, touchscreen input,
fractional scaling, and real monitor hotplug remain desktop checks, as described
in [INSTALL.md](INSTALL.md). The harness emits a monitor-change notification;
that check does not disconnect a physical display.

Native compatibility was checked against the tagged upstream sources:

- [GNOME Shell 51.0](https://github.com/GNOME/gnome-shell/tree/51.0), commit
  `2177bdf9624b2d285de7c1d34274073d3769d6b8`.
- [Mutter 51.0](https://github.com/GNOME/mutter/tree/51.0), commit
  `138a14fbeef09d49ebf5be8a0cb83b042dd5c841`.

The published `@girs/gnome-shell` JavaScript declarations still target 50 and
Mutter's older namespace. This port uses generated `@girs/*-51` native types and
small local declarations for the Shell JavaScript interfaces it actually uses.

See [SECURITY.md](SECURITY.md) for the remaining development-tool advisories;
the audit does not currently pass without findings.
