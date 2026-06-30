#!/bin/sh
# Test-only stand-in for $EDITOR: truncates the file, simulating a user
# deleting all content in their editor (cmd_edit must treat this as an
# aborted edit, not a deletion).
set -eu
: >"$1"
