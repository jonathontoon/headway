#!/bin/sh
# Tests for cmd_add.

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

# --- natural due dates resolve to explicit dates ----------------------------

cmd_add "Call the accountant due:today @calls" >/dev/null
line3=$(sed -n 3p "$TODO_FILE")
assert_match "due:$(today)" "$line3" "add: due:today resolves to real date"

cmd_add "Follow up due:tomorrow" >/dev/null
line4=$(sed -n 4p "$TODO_FILE")
expected_tomorrow=$(date_add_days "$(today)" 1)
assert_match "due:$expected_tomorrow" "$line4" "add: due:tomorrow resolves to tomorrow"

_ta_i=1
while [ "$(date_weekday_name "$(date_add_days "$(today)" "$_ta_i")")" != "monday" ]; do
	_ta_i=$((_ta_i + 1))
done
expected_monday=$(date_add_days "$(today)" "$_ta_i")
cmd_add "Review itinerary due:monday" >/dev/null
line5=$(sed -n 5p "$TODO_FILE")
assert_match "due:$expected_monday" "$line5" "add: due:monday resolves to next monday"

# --- numeric relative due dates are rejected -------------------------------

before_count=$(awk 'END{print NR}' "$TODO_FILE")
code=0
(cmd_add "Follow up due:+3d" >/dev/null 2>&1) || code=$?
assert_exit_code "1" "$code" "add: due:+3d is rejected"
code=0
(cmd_add "Follow up due:2d+" >/dev/null 2>&1) || code=$?
assert_exit_code "1" "$code" "add: due:2d+ is rejected"
after_count=$(awk 'END{print NR}' "$TODO_FILE")
assert_eq "$before_count" "$after_count" "add: relative due dates do not mutate file"

# --- invalid due date is rejected, no file mutation -------------------------

before_count=$(awk 'END{print NR}' "$TODO_FILE")
code=0
(cmd_add "Bad date due:not-a-date" >/dev/null 2>&1) || code=$?
assert_exit_code "1" "$code" "add: invalid due date exits non-zero"
after_count=$(awk 'END{print NR}' "$TODO_FILE")
assert_eq "$before_count" "$after_count" "add: invalid due date does not mutate file"

# --- dispatch_cmd routes `add` to cmd_add (in-shell code path) --------------

dispatch_cmd add "Quick capture +Inbox" >/dev/null
last_line=$(sed -n '$p' "$TODO_FILE")
assert_match "Quick capture" "$last_line" "dispatch add: appends a task"
assert_match "\+Inbox" "$last_line" "dispatch add: preserves project"

teardown_sandbox
report_and_exit
