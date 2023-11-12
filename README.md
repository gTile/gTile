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
If you prefer the CLI, you can use the dconf CLI tool to set specific settings. Note that it is less convenient in usage and requires you to take care of providing the settings in the proper format You may find a full list of available settings in `dist/schemas/org.gnome.shell.extensions.gtile.gschema.xml`.

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
3. Press one of `[1..9,0]` (total 10 available) for vertical columns autotiling, or `M` for "main" autotiling.
    * Press `M` multiple times to cycle through variants.
    * Main variables are configurable.

[![Main Variants](https://user-images.githubusercontent.com/4830810/109255942-93123b00-77ba-11eb-8976-0069ab6e8f55.jpg
)](https://user-images.githubusercontent.com/4830810/109256250-4418d580-77bb-11eb-8e50-4764a861cd85.mp4 "Main Variants")

### Autogrow

You can expand window - it will fill all available space up to borders with neighbors.
Default keyboard shortcut is `<Alt><Ctrl>s`
Autogrow works only when gTile window is activated

1. Focus on window you want to expand to fill space up to neighbors borders
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

## Prerequisites
To build and develop the extension `node`, `npm`, `git` and a few standard GNU utilities are required. Check the `scripts` section of `package.json` to see which GNU utilities are used.

To get started, checkout the repository and install the required dependencies:

```shell
git clone https://github.com/gTile/gTile.git
cd gTile
npm ci
```

## Workflow

Testing changes can be tedious at times because an extension cannot be updated in-place. The Gnome shell session must be restarted in order for changes to take effect. In Wayland it is usually much easier to start a nested session instead. Check the [GJS documentation](https://gjs.guide/extensions/development/debugging.html#reloading-extensions) on how to best debug extensions. Note that nested gnome sessions can take time to load and do not allow to test multi-screen setups. I personally found it most productive to have a second remote system which I can use to continuously test the extension on. For this purpose I added a simple new script to `package.json`:

```json
{
  "scripts": {
    "install:remote": "scp gtile.tgz remotehost:~/Downloads && ssh remotehost gnome-extensions install -f ~/Downloads/gtile.tgz",
  }
}
```

Deploying a change is as simple as executing `npm run build:dist && npm run install:remote` and restart the Gnome session on the remote system. When developing locally use the `npm run install:extension` command instead.

## Terminology
There are some domain-specific terms used throughout the entire code base. This table ought to be a glossary for these terms. Some of these may also translate 1:1 into a TypeScript interface. Check the `src/types/` directory.

Term   | Meaning
------ | -------
`GridSpec` | A simple domain specific language (DSL) used to describe complex grids with weighted col and row sizes and the ability to have cols and rows span over multiple cells.
`Grid` | A rectangular 2D grid that has a specified number of columns and rows.
`Grid size` | Refers to the dimensions of a grid, i.e. its number of columns and rows
`(Grid) offset` | A relative coordinate to a tile in a grid. The top-left tile in a grid is considered to have an offset of `(0, 0)`. The offset `(2, 5)` would refer to the tile in the 3rd column and the 6th row.
`(Grid) selection` | A rectangular selection of multiple tiles within a grid. It is defined in term of two offsets which specify the position of two opposite corner tiles of the selection.
`Preset` | Ambiguously used. Can refer to the user-specified grid size (presets), i.e. the list of grid sizes available for the user to choose in the overlay. Alternatively, this refers to the user-defined presets that auto-move & auto-resize the focused window according the configured preset.
`(Monitor) Inset` | A user-configurable screen margin respected by all gTile features (window placement, autogrow, autotiling, …). It causes windows to keep a fixed distance (in pixel) to the monitor edge(s).
`(Window) Margin` | A user-configurable window margin that causes windows to have an invisible border to them. The margin does not(!) apply towards the screen edges. Windows with a margin are still able to align with the screen edge, i.e., unless an inset is configured.

## Code Structure

```
dist                - Contents will be distributed 1:1 whenever the extension is build
├── images          - Assets that are referenced in the CSS stylesheet
├── schemas         - Contains the GSettings definitions. Required for reading/writing settings
├── metadata.json   - The extension metadata.json as recognized by Gnome
└── stylesheet.css  - The stylesheets file as recognized by Gnome

src                 - The TypeScript root directory
├── core            - Contains the main orchestration classes that are instantiated as singleton
├── types           - Contains _only_ TypeScript types that to NOT(!) emit code
├── ui              - Contains reusable UI building blocks utilized by the core classes
│                     They do not contain any logic other than strictly related to rendering
├── util            - Reusable helper classes or functions
├── extension.ts    - The entry point for the extension invoked by Gnome shell
└── prefs.ts        - The entry point for the preferences dialog
```

Note that `src/types/` must not contain any files that emit actual JS runtime code. Any files emited by `tsc` during transpilation are deleted by the `postbuild` script in `package.json`.

## Design Principles
The code base follows the [SOLID](https://en.wikipedia.org/wiki/SOLID) paradigm __up to an extend__. Although it doesn't strictly follow the paradigm it is definitely architectured with these principles in mind. Try to stick with these principles when changing the architecture, e.g., to make [adaptation for different desktop environments](https://github.com/gTile/gTile/issues/103) more easy.

The extension makes use of the GJS mechanisms were possible. In particular, the UI components make extensive use of GObject [Properties and Signals](https://gjs.guide/guides/gobject/basics.html) for synchronization purposes. UI components are modeled as general purpose, composable components. In particular, they do not contain any logic other than strictly related to rendering. Business logic is supposed to reside in an orchestrator.

## Code Style Guide
The project does intentionally avoid the use of linters such as prettier or eslint. Quick comprehension is more important than following strict code formatting rules. That being said, please try to comply with the implicit code style used throughout the code base. In particular:

- Respect the `.editorconfig` file - best with a plugin that automatically applies the rules.
- Code lines should not exceed 80 characters
- Public members (methods and fields) of exported classes should be documented in JSDoc style.
  - This also applies to exported types, interfaces and functions unless they are really self-explanatory.
- In general, private members of classes or non-exported types/functions should not require to be documented as the complexity of the inner-workings of a class (or similar) should remain comprehensible. In case the complexity gets out of hand consider to refactor the class or document the functions where necessary.
- Prefer [native ECMAScript private properties](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_properties) over [TypeScript’s `private` visibility specifier](https://www.typescriptlang.org/docs/handbook/2/classes.html#private).

At the time of its release, this extension was quite possibly the most TypeScript conform extension in the Gnome ecosystem. It is in the interest of the author to honor that by utilizing the capabilities of TypeScript where possible to achieve maximum type-safety during compile time.

## GridSpec DSL
`GridSpec` is a tiny DSL used to describe complex grids. It is described by the following grammar, whose syntax is using a [variant](https://en.wikipedia.org/wiki/Wirth_syntax_notation) of the Extended Backus-Naur Form ([EBNF](https://en.wikipedia.org/wiki/Extended_Backus%E2%80%93Naur_form)).

```
gridspec = [ ( colspec | rowspec ) ] .
colspec  = "cols" "(" cellspec { "," cellspec } ")" .
rowspec  = "rows" "(" cellspec { "," cellspec } ")" .
cellspec = <number> [ ( "d" | ":" ( colspec | rowspec ) ) ] .
```

Some examples of valid `GridSpec` definitions:

- `cols(1, 3, 1)`
  - Describes a grid consisting of three columns (and a single row). The first and last column have a relative width of 20% each (i.e. 1/5) and the center column has a size (relative to the row width) of 3/5, i.e., 60%.
- `rows(1, 1:col(3,3,3), 1d)`
  - Describes a grid consisting of three rows. The first and last row both consist of a single column with 100% width. The center row consists of three columns, each with 33% width. The last row is defined as a `dynamic` row, which affects how autotiling does place windows in it. Usually, autotiling assigns at most 1 window to each cell. Cells declared as `dynamic` may hold as many windows necessary. Windows placed into a dynamic cell all get the same share of this cell. For instance, if 2 windows were to be placed in the dynamic cell above, they would take 50% of the rows width each.

In general, the autotiling algorithm works as follows:
1. Given a `GridSpec`, find the largest non-dynamic cell (-> take the first found if there are multiple largest cells).
    - Place the focused window inside it, if any.
2. For all (remaining) windows on the currently active monitor: Place each window in one of the (remaining) non-dynamic cells and make it take the full width and height of that cell.
3. If there are still more windows remaining that couldn't yet be placed in a cell: Find all dynamic cells in the grid and place the remaining windows inside them.
    - Each window gets the same share of a dynamic cell (or its full size for a single window).

## Resources

When developing in the Gnome ecosystem, these are the go-to resources that you should refer to primarily.

- https://gjs.guide/ for a written documentation and explanation of core concepts.
- https://gjs-docs.gnome.org/ for an API reference of the GJS ecosystem.
- https://gitlab.gnome.org/GNOME/gnome-shell for checking the source code of the (otherwise officially undocumented) API of the Gnome-shell.
