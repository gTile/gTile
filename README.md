# gTile

[![Build Status](https://travis-ci.org/gonzojive/gTile.svg?branch=bazelify)](https://travis-ci.org/gonzojive/gTile)

Gnome-shell extension that improves window tiling capabilities of stock gnome-shell.

gTile is used to moves/resize windows on a configurable grid scheme.

It can be used with either the mouse, or keyboard, including customizable keyboard presets for immediate window placement.

This extension is particularly useful for window management on (multiple) large monitors.


## Installation


### Preferred: Installation from Gnome Extensions

Preferred installation is from [Gnome Extensions](https://extensions.gnome.org)


### Installation from Source

You can alternatively manually install the latest version from GitHub:

1. Clone the repository to the *Gnome* extensions folder.

```shell
git clone https://github.com/gTile/gTile.git
git checkout bazelify
```

2. (May not be necessary) Set up workspace dependencies. If you forget to run
   this command, bazel will give errors.

```shell
bazel run @nodejs//:yarn
```

3. Build and install


```shell
bazel run :install-extension
```

4. Restart *Gnome* (only on X11, on Wayland you will have to log out and log back in):

   1. Hit `Alt-F2`
   2. Type `r` and hit enter


## Configuration

For configuration, please use the built-in preferences dialog (Gnome Tweak Tool -> Extensions -> gTile -> Preferences).
For configuration changes to take effect, disable/enable gTile (Gnome Tweak Tool -> Extensions -> gTile -> Off/On )
In the *Help* tab you will find help and usage hints.

* Keyboard shortcuts:
    * Can be assigned from the preferences window (*Accelerators* tab)
    * Both the key combinations and the respective function are configurable
    * Can be Global (can be used directly without the main gTile window)
    * Can be non-global (can only be used when the gTile window is shown)
    * Up to 30 accelerators can be configured, which should be plenty
* Grid schemes:
    * Are defined in the preferences window (*Basic* tab)
    * Written as a comma-separated list of grid sizes like `8x7,3x2,4x6,4x7` (no spaces)
* Resize presets:
    * Are defined in the preferences window (*Reset presets* tab)
    * Format: grid size, top left corner, bottom right corner
    * Format examples: "2x2 0:1 0:1" or "6x4 0:2 3:3"
    * Grids setup here size can be of any size, not necessarily what you have set up in grid sizes settings


## Usage with interface

1. Make sure the window you want to resize has focus
2. Click on the gTile icon on the tool bar, or press `Super+Enter` (default)
3. The gTile dialog pop-up will show up in the center of your screen

### Using the mouse

4. Use the mouse cursor to click on one of the desired corner coordinates, and then the other corner coordinates
5. Window will resize after the second click

### Using the keyboard

4. Use the arrow keys to select the coordinate of the first corner and Shift-arrow to select the second coordinate
5. a) Hit `Space` to change the grid scheme [optional]
5. b) Hit `Enter` and the window will resize
5. c) Hit `Escape` to cancel resize


## Usage with no interface

You can also resize windows using Keyboard shortcuts directly.

There are 3 groups of pre-configured shortcuts, representing the following grid schemes:

* Grid 2x2 -> `Super + Alt`
* Grid 2x3 -> `Super + Control`
* Grid 3x3 -> `Super + Shift`

These "grid selectors" are then combined with a keypad number to define the window placement:

Default shortcuts for Super+Alt+[1..9(keypad)]

1 - Bottom left quarter of screen
2 - Bottom half
3 - Bottom right quarter
4 - Center left
5 - Center
6 - Center right
7 - Top left quarter
8 - Top half
9 - Top right quarter

**Note:** Preconfigured keyboard shortcuts are optimized for horizontal screens.


## Overlap with stock Gnome-shell shortcuts

gTile is intended to **supplement** existing Gnome-shell keyboard shortcuts.

Here are some useful Gnome built-ins to keep in mind when configuring gTile:
* Super + Up - Maximize
* Super + Down - Un-Maximize (return to size and position previous to maximizing)
* Super + Left/Right - left/right half of screen
* Shift + Super + Up/Down/Left/Right] - move window to adjacent monitor/workspace


## Source code

This extension is developed at [GitHub](https://github.com/gTile/gtile).

See gTile help in Preferences for info on development and debugging.

It was originally developed by [vibou](https://github.com/vibou) with help from multiple contributors, and is now community supported.

gTile is licensed under the [GPL v2+](https://www.gnu.org/licenses/gpl-2.0.html)

### Typescript

The repository contains TypeScript files (`.ts`) that are compiled and bundled
by [Bazel](http://bazel.io).

## Building and testing with Bazel

You do not need npm installed on your machine, nor any other libraries. However,
you do need to install bazel.

### One-time setup

This may no longer be necessary as of 2020, but it doesn't hurt:

```shell
bazel run @nodejs//:yarn
```

### Build/Test

```shell
bazel build ...
bazel test ...
```

### Install

```shell
bazel run :install-extension
```


### Add a new dependency

"dev" dependency:

```shell
bazel run @nodejs//:yarn -- add --dev "@bazel/karma"
```
