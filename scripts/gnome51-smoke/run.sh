#!/usr/bin/env bash
set -euo pipefail

# Run only in a disposable machine/container with GNOME Shell 51 installed.
# The compositor is headless and all user settings live in a temporary tree.
gnome-shell --version | grep -qE '^GNOME Shell 51\.'
script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repository="$(cd -- "$script_dir/../.." && pwd)"
smoke_dir="$(mktemp -d)"
trap 'rm -rf -- "$smoke_dir"' EXIT
export XDG_RUNTIME_DIR="$smoke_dir/runtime"
export XDG_CONFIG_HOME="$smoke_dir/config"
export XDG_DATA_HOME="$smoke_dir/data"
export XDG_CACHE_HOME="$smoke_dir/cache"
export GSETTINGS_BACKEND=keyfile
export GSK_RENDERER=cairo
export GTK_A11Y=none
mkdir -p "$XDG_RUNTIME_DIR" "$XDG_CONFIG_HOME" "$XDG_DATA_HOME" "$XDG_CACHE_HOME"
chmod 700 "$XDG_RUNTIME_DIR"

gnome-extensions install --force "$repository/gtile.dist.zip"
harness="$XDG_DATA_HOME/gnome-shell/extensions/gtile-smoke@local"
mkdir -p "$harness"
cp "$script_dir"/{extension.js,metadata.json,window.js,preferences.js} "$harness/"
mkdir -p "$XDG_DATA_HOME/applications"
cat > "$XDG_DATA_HOME/applications/org.gtile.SmokeWindow.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=gTile smoke window
Exec=gjs -m $harness/window.js
Icon=application-x-executable
EOF
rm -f /tmp/gtile-smoke-results.json

timeout 90s dbus-run-session -- bash -c '
  set -euo pipefail
  gsettings set org.gnome.shell enabled-extensions "[\"gtile-smoke@local\", \"gTile@vibou\"]"
  gsettings set org.gnome.desktop.interface enable-animations false
  gsettings set org.gnome.shell favorite-apps "[]"
  gsettings set org.gnome.shell welcome-dialog-last-shown-version "51.0"
  exec gnome-shell --wayland --no-x11 --headless \
    --virtual-monitor=1280x800 --virtual-monitor=1024x768
' > /tmp/gtile-smoke-shell.log 2>&1 || {
  tail -50 /tmp/gtile-smoke-shell.log
  exit 1
}
python3 - <<'PY'
import json
from pathlib import Path
path = Path('/tmp/gtile-smoke-results.json')
if not path.exists():
    raise SystemExit('Harness did not finish; inspect /tmp/gtile-smoke-shell.log')
result = json.loads(path.read_text())
print(json.dumps(result, indent=2))
if not result['passed']:
    raise SystemExit(1)
PY
