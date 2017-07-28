vibou.gTile
===========

Gnome-shell extension that tiles windows as you like.

This extension is developed at [GitHub](https://extensions.gnome.org/extension/28/gtile/)
If you are reading this documentation anywhere else, it might be out of date.

Manual Installation
-------------------

*Gnome* extensions must be in the *Gnome* extentions directory with a subdirectory name
which matches the **uuid** field of `metadata.json`.

See https://wiki.gnome.org/Projects/GnomeShell/Extensions for details.

1. Clone the repository to the *Gnome* extensions folder.

   ```
   git clone https://github.com/vibou/vibou.gTile.git ~/.local/share/gnome-shell/extensions/gTile@vibou
   ```

2. Restart *Gnome*

   ```
   Alt-F2
   Enter a Command: r
   ```


Configuration
------------

To configure gTile use preferences dialog

Author
------

This extension has been developed by [vibou](https://github.com/vibou) with the
help of the gnome-shell community. See
[network](https://github.com/vibou/vibou.gTile/network) for details.
           
CHANGE LOG
----------
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

