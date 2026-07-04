#!/bin/sh
# Tests for cmd_complete / cmd_undo, including the priority round-trip.

set -eu

cd "$(dirname "$0")/.."
. tests/helpers.sh
setup_sandbox

HEADWAY_LIB_ONLY=true
. ./headway.sh
detect_date_flavor

cmd_add "Call the accountant @calls" >/dev/null
cmd_add "Write project brief +Apollo due:2026-07-10" >/dev/null

# --- done on a non-prioritized task ----------------------------------------

before1=$(line_at 1)
cmd_complete 1 >/dev/null
line1=$(line_at 1)
assert_match "^x $(today) " "$line1" "complete: completion date stamped first"
assert_match "Call the accountant" "$line1" "complete: description preserved"
assert_match "@calls" "$line1" "complete: tag preserved"

code=0
(cmd_complete 1 >/dev/null 2>&1) || code=$?
assert_exit_code "1" "$code" "complete: re-completing an already-done task fails"

# --- undo restores the exact original line ---------------------------------

cmd_undo 1 >/dev/null
after1=$(line_at 1)
assert_eq "$before1" "$after1" "undo: byte-identical round trip (no priority)"

code=0
(cmd_undo 1 >/dev/null 2>&1) || code=$?
assert_exit_code "1" "$code" "undo: undoing a not-done task fails"

# --- done/undo round trip with a priority -----------------------------------

before2=$(line_at 2)
assert_match "^2026-" "$before2" "sanity: task 2 has no priority marker yet"

# Set a priority directly on the line so the round trip has something to
# preserve through pri:.
parse_line "$before2"
P_PRIORITY="A"
prioritized=$(format_line)
replace_line_at 2 "$prioritized"
before2=$(line_at 2)
assert_match "^\(A\) " "$before2" "sanity: task 2 now has priority (A)"

cmd_complete 2 >/dev/null
done2=$(line_at 2)
assert_match "pri:A" "$done2" "complete: priority moved to pri: extension"
assert_match "^x $(today) " "$done2" "complete: completion date present"

cmd_undo 2 >/dev/null
after2=$(line_at 2)
assert_eq "$before2" "$after2" "undo: byte-identical round trip (with priority)"

teardown_sandbox
report_and_exit
