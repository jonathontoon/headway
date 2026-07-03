#!/bin/sh
# Tests for cmd_list and the five lifecycle views: inbox/today/upcoming/
# someday/logbook, plus their shared filter argument.

set -eu

cd "$(dirname "$0")/.."
. tests/helpers.sh
setup_sandbox

HEADWAY_LIB_ONLY=true
. ./headway.sh
detect_date_flavor

today_d=$(today)
future_d=$(date_add_days "$today_d" 10)
yesterday_d=$(date_add_days "$today_d" -1)

cmd_add "Book flights to Lisbon" >/dev/null
cmd_add "Write project brief +Apollo due:$future_d @deepwork" >/dev/null
cmd_add "Call the accountant due:today @calls" >/dev/null
cmd_add "Pay overdue invoice due:$yesterday_d +Bills" >/dev/null
cmd_add "Follow up +Apollo" >/dev/null

# Two completed entries appended directly (bypassing cmd_complete),
# with distinct completion dates to exercise logbook's descending sort.
older_done=$(date_add_days "$today_d" -5)
newer_done=$(date_add_days "$today_d" -2)
printf 'x %s %s Archive old emails +Apollo\n' "$older_done" "$today_d" >>"$TODO_FILE"
printf 'x %s %s Clear out downloads folder\n' "$newer_done" "$today_d" >>"$TODO_FILE"

# --- list: all incomplete tasks, file order -------------------------------

list_out=$(cmd_list)
assert_eq "5" "$(printf '%s\n' "$list_out" | wc -l | tr -d ' ')" "list: shows all 5 incomplete tasks"
assert_match "^1: .*Book flights to Lisbon" "$list_out" "list: includes task 1"
assert_match "^5: .*Follow up" "$list_out" "list: includes task 5"

# --- inbox: tasks with no project, regardless of due ----------------------

inbox_out=$(cmd_inbox)
assert_eq "2" "$(printf '%s\n' "$inbox_out" | wc -l | tr -d ' ')" "inbox: two tasks have no project"
assert_match "^1: .*Book flights to Lisbon" "$inbox_out" "inbox: plain task present"
assert_match "^3: .*Call the accountant" "$inbox_out" "inbox: due:today task present (no project)"

# --- today: due today, plus overdue ---------------------------------------

today_out=$(cmd_today)
assert_eq "2" "$(printf '%s\n' "$today_out" | wc -l | tr -d ' ')" "today: due-today + overdue = 2"
assert_match "^3: .*Call the accountant" "$today_out" "today: due:today task present"
assert_match "^4: .*Pay overdue invoice" "$today_out" "today: overdue task present"

# --- upcoming: future-dated tasks ------------------------------------------

upcoming_out=$(cmd_upcoming)
assert_eq "1" "$(printf '%s\n' "$upcoming_out" | wc -l | tr -d ' ')" "upcoming: one future-dated task"
assert_match "^2: .*Write project brief" "$upcoming_out" "upcoming: future task present"

# --- someday: no due date ---------------------------------------------------

someday_out=$(cmd_someday)
assert_eq "2" "$(printf '%s\n' "$someday_out" | wc -l | tr -d ' ')" "someday: two tasks with no due date"
assert_match "^1: .*Book flights to Lisbon" "$someday_out" "someday: plain task present"
assert_match "^5: .*Follow up" "$someday_out" "someday: project task with no due present"

# --- logbook: completed tasks, most recent completion first ---------------

logbook_out=$(cmd_logbook)
assert_eq "2" "$(printf '%s\n' "$logbook_out" | wc -l | tr -d ' ')" "logbook: two completed tasks"
first_line=$(printf '%s\n' "$logbook_out" | sed -n 1p)
second_line=$(printf '%s\n' "$logbook_out" | sed -n 2p)
assert_match "^7: .*Clear out downloads folder" "$first_line" "logbook: most recently completed task first"
assert_match "^6: .*Archive old emails" "$second_line" "logbook: older completed task second"

# --- filtering: +Project ----------------------------------------------------

someday_apollo=$(cmd_someday "+Apollo")
assert_eq "1" "$(printf '%s\n' "$someday_apollo" | wc -l | tr -d ' ')" "someday +Apollo: one match"
assert_match "^5: .*Follow up" "$someday_apollo" "someday +Apollo: correct task"

# +Apo must not match +Apollo (whole-token filter, not substring)
someday_apo=$(cmd_someday "+Apo")
assert_eq "" "$someday_apo" "someday +Apo: no match (not a whole-token prefix)"

# --- filtering: @tag --------------------------------------------------------

upcoming_deepwork=$(cmd_upcoming "@deepwork")
assert_match "^2: .*Write project brief" "$upcoming_deepwork" "upcoming @deepwork: correct task"

today_apollo=$(cmd_today "+Apollo")
assert_eq "" "$today_apollo" "today +Apollo: no overlap, empty result"

# --- filtering: keyword (full-text search) ----------------------------------

list_keyword=$(cmd_list "accountant")
assert_eq "1" "$(printf '%s\n' "$list_keyword" | wc -l | tr -d ' ')" "list keyword: one match"
assert_match "^3: .*Call the accountant" "$list_keyword" "list keyword: correct task"

# --- empty TODO_FILE: views return cleanly with no output -------------------

EMPTY_TODO=$(mktemp)
TODO_FILE="$EMPTY_TODO"
empty_out=$(cmd_today)
assert_eq "" "$empty_out" "today on empty file: no output, no error"
rm -f "$EMPTY_TODO"

# --- SHOW_IDS=false hides task numbers in views -----------------------------

teardown_sandbox
setup_sandbox
HEADWAY_LIB_ONLY=true
. ./headway.sh
SHOW_IDS=false
load_config
detect_date_flavor

cmd_add "Hidden id task +Quiet" >/dev/null
no_ids_out=$(cmd_list)
assert_match "^$(today) Hidden id task \\+Quiet$" "$no_ids_out" "list: SHOW_IDS=false omits task id"

teardown_sandbox
report_and_exit
