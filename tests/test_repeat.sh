#!/bin/sh
# Tests for repeat: handling inside cmd_done - completing a recurring task
# creates the next occurrence with the due date advanced by one interval.

set -eu

cd "$(dirname "$0")/.."
. tests/helpers.sh
setup_sandbox

HEADWAY_LIB_ONLY=true
. ./headway.sh
detect_date_flavor

# --- daily ------------------------------------------------------------------

cmd_add "Take out the trash due:2026-06-29 repeat:daily" >/dev/null
before_count=$(awk 'END{print NR}' "$TODO_FILE")
cmd_done 1 >/dev/null
after_count=$(awk 'END{print NR}' "$TODO_FILE")
assert_eq "$((before_count + 1))" "$after_count" "repeat:daily: a new occurrence is appended"

completed=$(line_at 1)
assert_match "^x " "$completed" "repeat:daily: original line marked done"

next=$(line_at 2)
assert_match "^2026-" "$next" "repeat:daily: new occurrence is not done"
assert_match "due:2026-06-30" "$next" "repeat:daily: due date advanced by one day"
assert_match "repeat:daily" "$next" "repeat:daily: repeat: tag carried over"
assert_match "Take out the trash" "$next" "repeat:daily: description carried over"

# --- weekly ------------------------------------------------------------------

cmd_add "Water the plants due:2026-06-29 repeat:weekly" >/dev/null
id=$(awk 'END{print NR}' "$TODO_FILE")
cmd_done "$id" >/dev/null
next=$(line_at $((id + 1)))
assert_match "due:2026-07-06" "$next" "repeat:weekly: due date advanced by 7 days"

# --- monthly -----------------------------------------------------------------

cmd_add "Pay rent due:2026-06-29 repeat:monthly +Home" >/dev/null
id=$(awk 'END{print NR}' "$TODO_FILE")
cmd_done "$id" >/dev/null
next=$(line_at $((id + 1)))
assert_match "due:2026-07-29" "$next" "repeat:monthly: due date advanced by one month"
assert_match "\+Home" "$next" "repeat:monthly: project carried over"

# --- yearly ------------------------------------------------------------------

cmd_add "Renew passport due:2026-06-29 repeat:yearly" >/dev/null
id=$(awk 'END{print NR}' "$TODO_FILE")
cmd_done "$id" >/dev/null
next=$(line_at $((id + 1)))
assert_match "due:2027-06-29" "$next" "repeat:yearly: due date advanced by one year"

# --- priority is carried over to the next occurrence ------------------------

cmd_add "Backup the server due:2026-06-29 repeat:daily" >/dev/null
id=$(awk 'END{print NR}' "$TODO_FILE")
parse_line "$(line_at "$id")"
P_PRIORITY="B"
replace_line_at "$id" "$(format_line)"
cmd_done "$id" >/dev/null
next=$(line_at $((id + 1)))
assert_match "^\(B\) " "$next" "repeat: priority carried over to next occurrence"

# --- non-repeating task: done does not append a new line --------------------

cmd_add "One-off errand due:2026-06-29" >/dev/null
id=$(awk 'END{print NR}' "$TODO_FILE")
before_count=$(awk 'END{print NR}' "$TODO_FILE")
cmd_done "$id" >/dev/null
after_count=$(awk 'END{print NR}' "$TODO_FILE")
assert_eq "$before_count" "$after_count" "non-repeating task: no new occurrence appended"

teardown_sandbox
report_and_exit
