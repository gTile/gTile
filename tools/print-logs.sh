#!/usr/bin/env bash
set -euo pipefail

journalctl /usr/bin/gnome-shell | grep moveToM
