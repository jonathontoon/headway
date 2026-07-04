#!/bin/sh
# headway - a minimal todo.txt CLI task manager.
#
# POSIX sh ONLY. Do not use bashisms: no arrays, no [[ ]], no local,
# no +=, no here-strings, no C-style for loops. This script must run
# unmodified under dash and BusyBox ash.
#
# shellcheck disable=SC2034

set -eu

HEADWAY_VERSION="0.1.0"

TODO_FILE_DEFAULT="$HOME/todo.txt"
DONE_FILE_DEFAULT="$HOME/done.txt"
EDITOR_DEFAULT="vi"
COLOR_DEFAULT="auto"
SHOW_IDS_DEFAULT="true"
CONFIRM_DELETE_DEFAULT="true"

# Theme: bare SGR parameter codes (no \033[ / m wrapper) applied when
# COLOR is active. THEME_DESC is intentionally empty (unstyled).
THEME_PRIORITY_DEFAULT="1;33"
THEME_PROJECT_DEFAULT="36"
THEME_TAG_DEFAULT="35"
THEME_DUE_DEFAULT="1;31"
THEME_DATE_DEFAULT="2"
THEME_DESC_DEFAULT=""
THEME_REPEAT_DEFAULT="1;34"
THEME_DONE_DEFAULT="2;9"
