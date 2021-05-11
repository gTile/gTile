# gTile

Gnome-shell extension that improves window tiling capabilities of stock gnome-shell.

gTile is used to moves/resize windows on a configurable grid scheme.

It can be used with either the mouse, or keyboard, including customizable keyboard presets for immediate window placement.

This extension is particularly useful for window management on (multiple) large monitors.


## Installation

Preferred installation is from [Gnome Extensions](https://extensions.gnome.org/extension/28/gtile/).


### Installation from source
You can alternatively manually install the latest version from GitHub master branch:

1. Clone the repository to a folder of your choice.

   ```shell
   git clone https://github.com/gTile/gTile.git
   ```
   Note: It is not recommended to clone the repository directly into
   `$HOME/.local/share/gnome-shell/extensions/gTile@vibou`. The code gTile
   installs into the extensions folder is a compiled version of the code in the
   git repository, and the files may conflict.)

2. Build and install

   You will need to [install
   Bazel](https://docs.bazel.build/versions/master/install-ubuntu.html) on your
   system to run the build tool. Then, you can run the installation script to
   install to `$HOME/.local/share/gnome-shell/extensions/gTile@vibou`.

   ```shell
   bazel run :install-extension
   ```

3. Log out and log back in. (If you don't want to log out, you can restart gnome
   shell, which keeps all your windows open. Type `Alt`+`F2`, then type `r` and
   hit enter.)


### Debugging

If you encounter buggy behavior, it may help to view the log messages gTile
writes. These may be viewed with the following shell command:

```shell
journalctl --follow /usr/bin/gnome-shell | grep "gTile"
```

## Configuration

For configuration, please use the built-in preferences dialog (Gnome Tweak Tool -> Extensions -> gTile -> Preferences).

* Keyboard shortcuts:
  * Can be assigned from the preferences window (*Accelerators* tab)
  * Both the key combinations and the respective function are configurable
  * Can be Global (can be used directly without the main gTile window)
  * Can be non-global (can only be used when the gTile window is shown)
  * Up to 30 accelerators can be configured, which should be plenty
  * Up to 10 accelerators for AutoTiling
* Grid schemes:
  * Are defined in the preferences window (*Basic* tab)
  * Written as a comma-separated list of grid sizes like `8x7,3x2,4x6,4x7` (no spaces, columns first, then rows)
* Resize presets:
  * Are defined in the preferences window (*Reset presets* tab) 
  * Format: grid size, top left corner tile, bottom right corner tile[, additional format variants]
  * Coordinate origin: The tile at `0:0` always corresponds to the **top left**, no matter the grid size. 
    In a `6x4` grid `5:3` is the bottom right tile
  * Format examples: `2x2 0:1 0:1` or `6x4 0:2 3:3, 0:0 3:3, 3x2 0:0 1:1` for multiple cyclable presets
    
    ![gTile Preset specification illustrated](https://user-images.githubusercontent.com/11145016/57080232-61310a00-6cf2-11e9-9ba2-bdd55b62fd2c.png)
    <!--
    | columns → | index    | 0         | 1         | 2         |
    | --------- | -------- | --------- | --------- | --------- |
    | **rows**  | **0**    | 0:0       | 1:0       | 2:0       |
    | **↓**     | **1**    | 0:1       | 1:1       | 2:1       |
    -->
  * Grid size format variants can either reuse the last grid format (e.g `6x4 0:2 3:3, 0:0 3:3`) or define a new grid (e.g `6x4 0:2 3:3, 8x6 0:0 3:3`)
  * Grids defined here can differ from the grid sizes defined in the *Basic* tab

## Usage with interface

1. Make sure the window you want to resize has focus
2. Click on the gTile icon on the tool bar, or press `Super`+`Enter` (default)
3. The gTile dialog pop-up will show up in the center of your screen

What these buttons do:

- ![Toggle animation icon](https://raw.githubusercontent.com/gTile/gTile/master/images/animation-icon-black.png) <- this one toggles the animation of the changes to the preview drawing.

- ![Toggle auto-close icon](https://raw.githubusercontent.com/gTile/gTile/master/images/auto-close-icon-black.png) <- this one toggles the auto-closing of the gTile window after applying the changes.

### Using the mouse

4. Use the mouse cursor to click on one of the desired corner coordinates, and then the other corner coordinates
5. Window will resize after the second click

### Using the keyboard

4. Use the arrow keys to select the coordinate of the first corner and Shift-arrow to select the second coordinate
5. a) Hit `Space` to change the grid scheme [optional]
5. b) Hit `Enter` and the window will resize
5. c) Hit `Escape` to cancel resize


## Usage with no interface

You can also resize windows using keyboard shortcuts directly.

There are 3 groups of pre-configured shortcuts, representing the following grid schemes:

* Grid 2x2 -> `Super`+`Alt`
* Grid 2x3 -> `Super`+`Control`
* Grid 3x3 -> `Super`+`Shift`

These "grid selectors" are then combined with a keypad number to define the window placement. 

Default shortcuts for `Super`+`Alt`+`[KP_1..KP_9]`

Shortcut | Description
------------ | -------------
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


## AutoTiling

You can do auto tiling for all windows on screen

1. Activate gTile by pressing `Super`+`KP_Enter` or clicking on gTile icon
2. Click on one of 2 autotile buttons, or
3. Press one of `[1..9,0]` (total 10 available) for vertical columns autotiling, or `M` for "main" autotailing.
    * Press `M` multiple times to cycle through variants.
    * Main variables are configurable. 
    
[![Main Variants](https://user-images.githubusercontent.com/4830810/109255942-93123b00-77ba-11eb-8976-0069ab6e8f55.jpg
)](https://user-images.githubusercontent.com/4830810/109256250-4418d580-77bb-11eb-8e50-4764a861cd85.mp4 "Main Variants")

## Snap-To-Neighbors

You can expand window - it will fill all available space up to borders with neighbors.
Default keyboard shortcut is `<Alt><Ctrl>s`
Snap-to-neighbors works only when gTile window is activated

1. Focus on window you want to expand to fill space up to neighobrs borders
2. Activate gTile window `<Super>Enter`
3. Press `<Alt><Ctrl>s`. Your windows will snap to neighbors.
4. Close gTile window `Escape`


## Overlap with stock Gnome-shell shortcuts

gTile is intended to **supplement** existing Gnome-shell keyboard shortcuts.

Here are some useful Gnome built-ins to keep in mind when configuring gTile:

Shortcut | Description
------------ | -------------
`Super`+`Up` | Maximize
`Super`+`Down` | Un-Maximize (return to size and position previous to maximizing)
`Super`+`Left/Right` | left/right half of screen
`Shift`+`Super`+`Up/Down/Left/Right` | move window to adjacent monitor/workspace 


## Source code

This extension is developed at [GitHub](https://github.com/gTile/gtile).

It was originally developed by [vibou](https://github.com/vibou) with help from multiple contributors, and is now community supported.

gTile is licensed under the [GPL v2+](https://www.gnu.org/licenses/gpl-2.0.html)

For debugging, enable debug in preferences, and in terminal run journalctl /usr/bin/gnome-shell -f

## Enjoy!
