CHANGE LOG
----------
### 57
- Fix #363: The keybinding dialog now also works on X11
- Builds no longer requires the `compilerOptions.skipLibCheck` build option.

### 56
- Fix #361: gnome-shell process froze due to an allocation size overflow when changing the grid size list in the extension preferences.

### 55
- Satisfy non-functional requirements to be publishable on extensions.gnome.org.

### 54
- Add preferences dialog

### 53

- Complete rewrite. Check [PR #341](https://github.com/gTile/gTile/pull/341) for more information and breaking changes.
- Support for Gnome 45

### 52

Mantenance release, bumped up gnome-shell version
Fix #305 - null metawindow for autotile global shortcut

### 51

Maintenance release, bumped up gnome-shell version
Minor fixes to stylesheet

### V49

Breaking change:

- Tile coordinates now starts with 1 instead of 0. If you defined custom accelerators, you need to increase all coordinates by 1.
- Tiling will not work on coordinates cotnaining 0.

New and changed functionality:

- Tile coordinates can be specified from right (down) edge by using negative nubmer, i.e. -3:-1 -4:-2
- Tile coordinates can be specified as float in range 0.0 .. 1.0, prefixed by "~", i.e. ~0.1:~0.2 ~0.5:~0.6
- All styles of tile coordinates can be mixed and matched, i.e. 2:-3 ~0.5:-1
- Fixed rounding error for shortcuts window placement

### V48

New and changed functionality:

- More intuitive behavior on manual window move/resize around screen edges
- Autoclose GUI after keyboard shortcut (disabled by default)
- Keyboard shortcut target monitor with mouse (disabled by default)

Changes enforced by gnome-shell:

- Remove deprecated Lang

### V47

New and changed functionality:
- Theme support. Light, dark, classic and default themes.

Bug fixes:
- Fix - wrong argument list for Box.packing, in prefs

Changes enforced by gnome-shell policies and upgrades:
- Get rid of globals in hotkeys
- Partially move out of Lang

### V28

-   Increase max margins to 240 - fix #40
-   Added 10 keyboard accelerators for AutoTiling - fix #32
-   Allow to hide icon - fix #37
-   Fix floating background window jumps
-   Fix reference to invalid objects that happens in mouse resize
-   Gnome-shell version support to 28

### V26

-   Event connection leak on focus-window
-   Autodetect panels on screen, removed settings TopPanel and Bottom Panel
-   Support screen rotation for keyboard shortcuts
-   Sort preset keys in preferences

### V25

-   Add full keyboard control, window position presets, full settings control through preferences dialog. Fixed couple bugs here and there.

### V21

-   Fix an issue on tracking focused window


### V20

-   Add compatibility with Gnome-Shell 10

### V17

-   Fix some UI Issues

### V16

-   UI changes

### V15

-   Compatibility Gnome Shell 3.6.1

### V14

-   Compatibility Gnome Shell 3.4.1 + small bug correction

### V13

-   Add Key binding settings + Compatibility 3.4.1

### V12

-   Correct small bug on auto tile where monitor height was considered without gnome-panel on primaryMonitor

### V11

-   AutoTile function : 2 new auto tile features + Replace Animation and auto close text by icons

### V10

-   Now gTile follows your focus window !! Thanks to Claus Beerta he implements it in a branch.
-   I change the implementation so that it works with  multi-screen and I also added animations.

### V9

-   Not validated

-   However he added the keybinding in settings (into the file extension.js) but it s still buggy I think
-   So I let it for those who wants to try it.

### V8

-   Correct bug where Desktop can be tile
-   3x2 button added by default

### V7

-   Add Auto-close once resize
-   Add Smooth animation when toggle extension
-   New icon
    (/!\ auto-close may cause some bugs so let me know if you had any thanks).
