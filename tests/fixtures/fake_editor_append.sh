#!/bin/sh
# Test-only stand-in for $EDITOR: appends " EDITED" to the file's content,
# simulating a non-interactive editor session for cmd_edit tests.
set -eu
content=$(cat "$1")
printf '%s EDITED\n' "$content" >"$1"
