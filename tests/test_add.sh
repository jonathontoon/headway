#!/bin/sh
# Tests for cmd_add / the `a` shorthand.

set -eu

cd "$(dirname "$0")/.."
. tests/helpers.sh
setup_sandbox

HEADWAY_LIB_ONLY=true
. ./headway.sh
detect_date_flavor

# --- plain add, no extensions ----------------------------------------------

cmd_add "Book flights to Lisbon" >/dev/null
assert_eq "1" "$(awk 'END{print NR}' "$TODO_FILE")" "add: one line written"
assert_file_contains "$TODO_FILE" "^[0-9]{4}-[0-9]{2}-[0-9]{2} Book flights to Lisbon$" "add: plain task format"
assert_match "$(today)" "$(sed -n 1p "$TODO_FILE")" "add: creation date is today"

# --- add with project, due, tag ---------------------------------------------

cmd_add "Write project brief +Apollo due:2026-07-10 @deepwork" >/dev/null
line2=$(sed -n 2p "$TODO_FILE")
assert_match "\+Apollo" "$line2" "add: project token present"
assert_match "due:2026-07-10" "$line2" "add: literal due date passed through"
assert_match "@deepwork" "$line2" "add: tag token present"

# --- due:today shorthand resolves to the actual current date ---------------

cmd_add "Call the accountant due:today @calls" >/dev/null
line3=$(sed -n 3p "$TODO_FILE")
assert_match "due:$(today)" "$line3" "add: due:today resolves to real date"

# --- due:+3d shorthand resolves correctly -----------------------------------

cmd_add "Follow up due:+3d" >/dev/null
line4=$(sed -n 4p "$TODO_FILE")
expected_due=$(date_add_days "$(today)" 3)
assert_match "due:$expected_due" "$line4" "add: due:+3d resolves to today+3"

# --- invalid due date is rejected, no file mutation -------------------------

before_count=$(awk 'END{print NR}' "$TODO_FILE")
code=0
(cmd_add "Bad date due:not-a-date" >/dev/null 2>&1) || code=$?
assert_exit_code "1" "$code" "add: invalid due date exits non-zero"
after_count=$(awk 'END{print NR}' "$TODO_FILE")
assert_eq "$before_count" "$after_count" "add: invalid due date does not mutate file"

# --- `a` shorthand behaves identically to `add` (dispatched via main) ------

main a "Quick capture +Inbox" >/dev/null
last_line=$(sed -n '$p' "$TODO_FILE")
assert_match "Quick capture" "$last_line" "a: shorthand adds a task"
assert_match "\+Inbox" "$last_line" "a: shorthand preserves project"

teardown_sandbox
report_and_exit
