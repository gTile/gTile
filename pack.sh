#!/bin/bash
# Pack extension for upload to EGO

gnome-extensions pack -f \
--extra-source hotkeys.js \
--extra-source logging.js \
--extra-source shellversion.js \
--extra-source snaptoneighbors.js \
--extra-source=settings.js \
--extra-source images \
--extra-source LICENSE \
--extra-source README.md

unzip -l gTile@vibou.shell-extension.zip

