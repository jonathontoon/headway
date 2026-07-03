#!/bin/sh
# Tests for Tier 2 features exercised at the function level: bulk ids on
# complete/undo/delete, cmd_show, symmetric clear/set on due/tag/project.

set -eu

cd "$(dirname "$0")/.."
. tests/helpers.sh
setup_sandbox

HEADWAY_LIB_ONLY=true
. ./headway.sh
detect_date_flavor

# --- bulk complete: multiple ids in one call -------------------------------

cmd_add "task one" >/dev/null
cmd_add "task two" >/dev/null
cmd_add "task three" >/dev/null

cmd_complete 1 3 >/dev/null
assert_match "^x " "$(sed -n 1p "$TODO_FILE")" "bulk complete: id 1 marked done"
assert_match "^x " "$(sed -n 3p "$TODO_FILE")" "bulk complete: id 3 marked done"
assert_eq "0" "$(sed -n 2p "$TODO_FILE" | grep -c '^x ' || true)" \
	"bulk complete: id 2 untouched"

# --- bulk undo -------------------------------------------------------------

cmd_undo 1 3 >/dev/null
assert_eq "0" "$(sed -n 1p "$TODO_FILE" | grep -c '^x ' || true)" \
	"bulk undo: id 1 re-opened"
assert_eq "0" "$(sed -n 3p "$TODO_FILE" | grep -c '^x ' || true)" \
	"bulk undo: id 3 re-opened"

# --- bulk with a bad id in the middle: nothing mutates ---------------------

before=$(cat "$TODO_FILE")
code=0
(cmd_complete 1 99 2 >/dev/null 2>&1) || code=$?
assert_exit_code "1" "$code" "bulk complete: bad id aborts with exit 1"
after=$(cat "$TODO_FILE")
assert_eq "$before" "$after" "bulk complete: bad id leaves file unchanged"

# --- bulk delete: out-of-order args deleted in descending order ------------

teardown_sandbox
setup_sandbox
HEADWAY_LIB_ONLY=true
. ./headway.sh
detect_date_flavor
# setup_sandbox already sets CONFIRM_DELETE=false, so cmd_delete skips
# the prompt.

for i in 1 2 3 4 5; do cmd_add "task $i" >/dev/null; done

cmd_delete 2 4 >/dev/null
remaining=$(cat "$TODO_FILE")
assert_eq "3" "$(printf '%s\n' "$remaining" | awk 'NF { n++ } END { print n + 0 }')" \
	"bulk delete: two removed, three remain"
assert_eq "0" "$(printf '%s\n' "$remaining" | grep -c 'task 2' || true)" \
	"bulk delete: task 2 gone"
assert_eq "0" "$(printf '%s\n' "$remaining" | grep -c 'task 4' || true)" \
	"bulk delete: task 4 gone"
assert_match "task 1" "$remaining" "bulk delete: task 1 preserved"
assert_match "task 3" "$remaining" "bulk delete: task 3 preserved"
assert_match "task 5" "$remaining" "bulk delete: task 5 preserved"

# --- delete: EOF on the confirm prompt cancels (safe default) --------------

teardown_sandbox
setup_sandbox
HEADWAY_LIB_ONLY=true
. ./headway.sh
detect_date_flavor
CONFIRM_DELETE=true

cmd_add "keep me" >/dev/null
code=0
out=$(cmd_delete 1 </dev/null 2>&1) || code=$?
assert_exit_code "0" "$code" "delete with EOF prompt: exit 0 (cancelled, not failed)"
assert_match "cancelled" "$out" "delete with EOF prompt: cancellation announced"
assert_eq "1" "$(awk 'END { print NR }' "$TODO_FILE")" "delete cancelled: task intact"

# --- show <id>: labelled detail block --------------------------------------

teardown_sandbox
setup_sandbox
HEADWAY_LIB_ONLY=true
. ./headway.sh
detect_date_flavor

cmd_add "Draft the Q3 plan +Apollo due:2026-07-15 @deepwork" >/dev/null
cmd_priority 1 A >/dev/null

show_out=$(cmd_show 1)
assert_match "^id:         1" "$show_out" "show: id line"
assert_match "^status:     open" "$show_out" "show: status open"
assert_match "^priority:   A" "$show_out" "show: priority pulled from (A)"
assert_match "^desc:       Draft the Q3 plan" "$show_out" "show: description"
assert_match "^project:    \+Apollo" "$show_out" "show: project"
assert_match "^tags:       @deepwork" "$show_out" "show: tag"
assert_match "^due:        2026-07-15" "$show_out" "show: due"

# show on a completed task pulls priority from pri: and reports status=done.
cmd_delete 1 >/dev/null
cmd_add "Simple task" >/dev/null
cmd_complete 1 >/dev/null
show_out=$(cmd_show 1)
assert_match "^status:     done" "$show_out" "show: completed task shows status=done"
assert_match "^completed:  " "$show_out" "show: completion date present"

# --- project: unified view (+X) and set (<id> +X | none) -------------------

teardown_sandbox
setup_sandbox
HEADWAY_LIB_ONLY=true
. ./headway.sh
detect_date_flavor

cmd_add "in project +Apollo" >/dev/null
cmd_add "no project yet" >/dev/null

view_out=$(cmd_project "+Apollo")
assert_match "in project" "$view_out" "project +X: view lists Apollo tasks"

cmd_project 2 +Apollo >/dev/null
line2=$(sed -n 2p "$TODO_FILE")
assert_match "\+Apollo" "$line2" "project <id> +X: task assigned"

cmd_project 2 none >/dev/null
line2=$(sed -n 2p "$TODO_FILE")
assert_eq "0" "$(printf '%s\n' "$line2" | grep -c '+Apollo' || true)" \
	"project <id> none: project cleared"

teardown_sandbox
report_and_exit
