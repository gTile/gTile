vibou.gTile
===========

Gnome-shell extension that tiles windows as you like.
gTile moves/resizes windows on a grid with help of mouse and/or keyboard.
Have customizable keyboard presets for immediate window placement.

gTile purpose is to supplement Gnome built-in window placement.
Very effective when you have to work with many windows on (multiple) very large monitors.

This extension is developed at [GitHub](https://github.com/gTile)
For configuration, please use preferences dialog (Gnome Tweak Tool->Extensions->gTile->Preferences->Help).
You will find there help and usage hints.

Prefered installation is from [Gnome Extensions](https://extensions.gnome.org)

You can install manually latest stable version from GitHub master branch:

1. Clone the repository to the *Gnome* extensions folder.

   ```
   git clone https://github.com/gTile/master.git ~/.local/share/gnome-shell/extensions/gTile
   ```

2. Restart *Gnome*

   ```
   Alt-F2
   Enter a Command: r


Author and License

This extension has been originally developed by [vibou](https://github.com/vibou) with help of many contributors, now supported by open source community.

License: MIT

Description
           
gTile allow to quickly move/resize/place window on predefined grid,
with mouse or keyboard, on multiple monitors.
How to use gTile
Set focus to window you want to resize (click, use TAB etc)
Click on icon on toolbar or press Super+Enter (keypad) (configurable)
You will see gTile dialog popup
Use mouse and click on desired left corner location,
Then other corner location, inside gTile window
Window will resize on second click
Or
Use arrows to move window and Shift-arrows to resize window
  When done, hit Enter - window will resize
  Hit Escape - to cancel resize
  Hit Space - change grid in cycle
  
You can use Keyboard shortcuts. 
Preconfigured keyboard shortcuts are optimized for horizontal screens.
There are 3 groups of shortcuts-
for grid 2x2, 2x3 and 3x3. All shortcuts have a form of
Super + [Alt/Shift/Control]+[1..9(Keypad)]
Grid 2x2 -> Super + Alt
Grid 2x3 -> Super + Control
Grid 3x3 -> Super + Shift
Default shortcuts for Super+Alt+[1..9(keypad)]
1 - left down quarter of screen
2 - lower half
3 - right down quarter
4 - left vertical quarter
5 - middle quarter
6 - right vertical quarter
7 - left upper quarter
8 - upper half
9 - right upper quarter

Default shortcuts for Super+Shift+[1..9(keypad)]
Window will be placed in 1/9th of screen that correspond to 
location of key on keypad.

Default shortcuts for Super+Control+[1..9(Keypad)]
1 - left lower third
2 - lower third
3 - right lower third
4 - left middle third
5 - right middle upper third
6 - right upper third
7 - left upper third
8 - left upper middle third
9 - right upper third

If you need some other position for window, hit Super + Enter (Keypad),
and use Up/Down/Left/Right to move, with Shift to resize window.
Default grid is 8x6, but you can change it from preconfigured list with space.
Escape will cancel, and Enter will finish window placement.

Change shortcut to fit your needs in preferences.
You can change both keys and what it is doing.
Keyboard shortcuts can be Global (works without gTile window)
or non-global (first show gTile window Super-Enter (keypad)).
Keyboard Accelerators are reassignable in preferences.
You have 30 accelerators, should be plenty.
You can define your own grid sizes, like something odd 17x19
Prime numbers usually the oddest ones.
Set it in basic settings - it is comma-separatel list of
grid sizes like 8x7,3x2,4x6,4x7
Resize preset format: grid size, left upper corner, right down corner
Left upper corner is 0:0.
Do not forget that you can grid dimension is one more then corner coordinate.
format is 6x4 0:2 3:3
Grid size can be any, not necessary what you have in grid sizes setting.

gTile intended to supplement existing Gnome keyboard shortcuts.
Here are some useful Gnome built-in:
Super + Up/Down - Toggle Maximize
Super + Left/Right - left/right half of screen
Shift + Super + Up/Down/Left/Right] - move window to adjancent monitor

Toggle Maximize Vertically/Horizontally is not defined by default in Gnome,
but very useful to have. It is recommended that you will define by yourself
in Settings->Keyboard.
                  
Other notes: Space defined as key binding to change-tiling. Gnome does not allow                  
to do global binding on Space, it will be shown as disabled in preferences
and cannot be redefined. But, nevertheless it works.

Enjoy!
