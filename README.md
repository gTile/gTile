# gTile

### The Gnome 45 version of gTile has undergone a rewrite! If you experience any regressions please check PR #341 for a summary of breaking changes. If you experience an undocumented regression please open a new issue.

- Gnome-shell extension that improves window tiling capabilities of stock gnome-shell.
- gTile is used to move/resize windows on a configurable grid scheme.
- It can be used with either the mouse, or keyboard, including customizable keyboard presets for immediate window placement.
- This extension is particularly useful for window management on (multiple) large monitors.

**Acknowledgement**: The original idea and the first implementation of gTile was developed by [vibou](https://github.com/vibou) with the help from multiple contributors. gTile is now a community supported project and licensed under the [GPL v2+](https://www.gnu.org/licenses/gpl-2.0.html)

# Table of Contents

- [User Documentation](#user-documentation)
  - [Installation](#installation)
    - [Install from Gnome Extensions](#install-from-gnome-extensions)
    - [Install from Source](#install-from-source)
  - [Configuration](#configuration)
    - [Dconf Editor](#dconf-editor)
    - [dconf CLI](#dconf-cli)
  - [Usage](#usage)
    - [Overlay](#overlay)
    - [Hotkeys](#hotkeys)
    - [AutoTiling](#autotiling)
    - [Autogrow](#autogrow)
    - [Stock Gnome-shell shortcuts](#stock-gnome-shell-shortcuts)
- [Developer Documentation](#developer-documentation)
  - [Prerequisites](#prerequisites)
  - [Workflow](#workflow)
  - [Terminology](#terminology)
  - [Code Structure](#code-structure)
  - [Design Principles](#design-principles)
  - [Code Style Guide](#code-style-guide)
  - [GridSpec DSL](#gridspec-dsl)
  - [Resources](#resources)

# User Documentation

## Installation

You can either install the extension from the offical Gnome extensions repository or build & install it from source.

### Install from Gnome Extensions
The preferred installation is through [Gnome Extensions](https://extensions.gnome.org/extension/28/gtile/).

### Install from Source
Alternatively, you can build and install the latest version from GitHub. Make sure to have a working `git` and `npm` installation.

```shell
git clone https://github.com/gTile/gTile.git
cd gTile
npm ci
npm run build:dist
npm run install:extension
```

After restarting your Gnome shell session you can enable the extension via:

```shell
$ gnome-extensions enable gTile@vibou
```

## Configuration

*PREFERENCE DIALOG IS A WORK IN PROGRESS*

gTile was recently rewritten for Gnome 45. There is no dedicated preference dialog yet. All configuration from a previous version of gTile should continue to work out of the box. For the time being if you want to change the extension configuration, you can use either the Dconf Editor (recommended) or the `dconf` command line tool. In either case, settings are stored the directory `/org/gnome/shell/extensions/gtile/`. Note that settings are applied immediately with the exception of the `theme` setting.

### Dconf Editor

If you have installed the [Dconf Editor](https://wiki.gnome.org/Apps/DconfEditor) you can simply use it to modify the extension settings by browsing the the corresponding section `/org/gnome/shell/extensions/gtile/`. If you do not see all of the extension settings you need to compile and install the GSettings schema first.

```shell
mkdir -p ~/.local/share/glib-2.0/schemas
cd ~/.local/share/glib-2.0/schemas
cp ~/.local/share/gnome-shell/extensions/gTile@vibou/schemas/org.gnome.shell.extensions.gtile.gschema.xml .
glib-compile-schemas .
```

You should now see a list of all settings in the Dconf editor and can edit them to your need.

### dconf CLI
If you prefer the CLI, you can use the dconf CLI tool to set specific settings. Note that it is less convinient in usage and requires you to take care of providing the settings in the proper format You may find a full list of available settings in `dist/schemas/org.gnome.shell.extensions.gtile.gschema.xml`.

CLI example:
```shell
# Show current setting overrides
dconf dump /org/gnome/shell/extensions/gtile/

# Disable the auto-close setting
dconf write /org/gnome/shell/extensions/gtile/auto-close false

# Change the available grid-sizes
dconf write /org/gnome/shell/extensions/gtile/grid-sizes "'8x6,6x4,4x4,3x1'"
```

## Usage

gTile can be used either through its graphical user interface ("overlay") or exclusively with the keyboard via hotkeys.

### Overlay

1. Make sure the window you want to resize has focus
2. Click on the gTile icon on the tool bar, or press `<Super>+<Enter>` (default)
3. The gTile dialog pop-up will show up at your cursors position
    - The ![Toggle auto-close icon](https://raw.githubusercontent.com/gTile/gTile/master/images/icons/dark/32/auto-close.png) button toggles the auto-closing of the gTile window after applying the changes.

**Option A: Mouse usage:**

4. Use the mouse cursor to click on one of the desired corner coordinates, and then the other corner coordinates
5. Window will resize after the second click

**Option B: Keyboard usage:**

4. Use the arrow keys to select the coordinate of the first corner and Shift-arrow to select the second coordinate
    - Hit `Space` to change the grid scheme [optional]
    - Hit `Enter` and the window will resize
    - Hit `Escape` to cancel resize

**Option C: Using the keyboard with configured presets:**

4. Press the accelerator key binding configured for the desired preset
5. Window will resize, GUI stays open allowing for additional window resizing. Alternatively, enable Basic setting "Auto close on keyboard shortcut" to automatically exit after a single command.

### Hotkeys

You can also resize windows using keyboard shortcuts directly.

There are 3 groups of pre-configured shortcuts, representing the following grid schemes:

* Grid 2x2 -> `Super`+`Alt`
* Grid 2x3 -> `Super`+`Control`
* Grid 3x3 -> `Super`+`Shift`

These "grid selectors" are then combined with a keypad number to define the window placement.

Default shortcuts for `Super`+`Alt`+`[KP_1..KP_9]`

Shortcut             | Description
-------------------- | -----------
`Super`+`Alt`+`KP_1` | Bottom left quarter of screen
`Super`+`Alt`+`KP_2` | Bottom half
`Super`+`Alt`+`KP_3` | Bottom right quarter
`Super`+`Alt`+`KP_4` | Center left
`Super`+`Alt`+`KP_5` | Center
`Super`+`Alt`+`KP_6` | Center right
`Super`+`Alt`+`KP_7` | Top left quarter
`Super`+`Alt`+`KP_8` | Top half
`Super`+`Alt`+`KP_9` | Top right quarter

**Notes:**
1. Preconfigured keyboard shortcuts are optimized for horizontal screens.
2. For **cyclable presets**, invoke the corresponding shortcut consecutively on a window to activate format variants.

### AutoTiling

You can do auto tiling for all windows on screen

1. Activate gTile by pressing `Super`+`KP_Enter` or clicking on gTile icon
2. Click on one of 2 autotile buttons, or
3. Press one of `[1..9,0]` (total 10 available) for vertical columns autotiling, or `M` for "main" autotailing.
    * Press `M` multiple times to cycle through variants.
    * Main variables are configurable.

[![Main Variants](https://user-images.githubusercontent.com/4830810/109255942-93123b00-77ba-11eb-8976-0069ab6e8f55.jpg
)](https://user-images.githubusercontent.com/4830810/109256250-4418d580-77bb-11eb-8e50-4764a861cd85.mp4 "Main Variants")

### Autogrow

You can expand window - it will fill all available space up to borders with neighbors.
Default keyboard shortcut is `<Alt><Ctrl>s`
Autogrow works only when gTile window is activated

1. Focus on window you want to expand to fill space up to neighobrs borders
2. Activate gTile window `<Super>+<Enter>`
3. Press `<Alt><Ctrl>s`. Your windows will snap to neighbors.
4. Close gTile window `Escape`


### Stock Gnome-shell shortcuts

gTile is intended to **supplement** existing Gnome-shell keyboard shortcuts.

Here are some useful Gnome built-ins to keep in mind when configuring gTile:

Shortcut | Description
------------ | -------------
`Super`+`Up` | Maximize
`Super`+`Down` | Un-Maximize (return to size and position previous to maximizing)
`Super`+`Left/Right` | left/right half of screen
`Shift`+`Super`+`Up/Down/Left/Right` | move window to adjacent monitor/workspace

# Developer Documentation

 TODO
