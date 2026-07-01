#!/bin/sh
# Tests for hw shell (the interactive REPL).

set -eu

cd "$(dirname "$0")/.."
. tests/helpers.sh
setup_sandbox

HEADWAY_LIB_ONLY=true
. ./headway.sh
load_config
detect_date_flavor

# --- multiple commands run in one session -----------------------------------

out=$(printf 'add "Buy milk +Errands due:2026-07-10"\nlist\nexit\n' | cmd_shell)
code=$?
assert_exit_code "0" "$code" "shell: exit code 0 after 'exit'"
assert_match "added 1: .*Buy milk \+Errands due:2026-07-10" "$out" "shell: add ran inside the session"
assert_match "1: .*Buy milk \+Errands" "$out" "shell: list ran inside the same session"

# --- 'quit' also ends the session cleanly ------------------------------------

teardown_sandbox
setup_sandbox
HEADWAY_LIB_ONLY=true
. ./headway.sh
load_config
detect_date_flavor

code=0
printf 'quit\n' | cmd_shell >/dev/null || code=$?
assert_exit_code "0" "$code" "shell: 'quit' ends the session cleanly"

# --- EOF (no exit/quit typed) also ends the session cleanly ------------------

code=0
printf '' | cmd_shell >/dev/null || code=$?
assert_exit_code "0" "$code" "shell: EOF ends the session cleanly"

# --- blank lines are skipped, not treated as commands ------------------------

out=$(printf '\n\nlist\n\nexit\n' | cmd_shell)
assert_eq "0" "$(printf '%s\n' "$out" | grep -c 'unknown command')" "shell: blank lines produce no errors"

# --- an invalid command doesn't kill the session ------------------------------

out=$(printf 'bogus\nadd "Still works"\nlist\nexit\n' | cmd_shell 2>&1)
assert_match "unknown command: bogus" "$out" "shell: invalid command is reported"
assert_match "added 1: .*Still works" "$out" "shell: session continues after an invalid command"
assert_match "1: .*Still works" "$out" "shell: list after the invalid command still sees the added task"

# --- quoted multi-word text is preserved as a single argument ---------------

teardown_sandbox
setup_sandbox
HEADWAY_LIB_ONLY=true
. ./headway.sh
load_config
detect_date_flavor

printf 'add "Write project brief +Apollo @deepwork"\nexit\n' | cmd_shell >/dev/null
assert_eq "1" "$(awk 'END{print NR}' "$TODO_FILE")" "shell: quoted add wrote exactly one line"
assert_file_contains "$TODO_FILE" "Write project brief \+Apollo @deepwork" "shell: quoted multi-word text stayed intact"

teardown_sandbox
report_and_exit
