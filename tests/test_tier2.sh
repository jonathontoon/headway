#!/bin/sh
# Tests for Tier 2: bulk complete/undo/delete, show, -y/--yes global flag,
# and the folded project view/set command.

set -eu

cd "$(dirname "$0")/.."
. tests/helpers.sh
setup_sandbox

HW=./headway.sh

# --- bulk complete: multiple ids in one call -------------------------------

$HW add "task one" >/dev/null
$HW add "task two" >/dev/null
$HW add "task three" >/dev/null

$HW complete 1 3 >/dev/null
assert_match "^x " "$(sed -n 1p "$TODO_FILE")" "bulk complete: id 1 marked done"
assert_match "^x " "$(sed -n 3p "$TODO_FILE")" "bulk complete: id 3 marked done"
assert_eq "0" "$(sed -n 2p "$TODO_FILE" | grep -c '^x ' || true)" \
	"bulk complete: id 2 untouched"

# --- bulk undo -------------------------------------------------------------

$HW undo 1 3 >/dev/null
assert_eq "0" "$(sed -n 1p "$TODO_FILE" | grep -c '^x ' || true)" \
	"bulk undo: id 1 re-opened"
assert_eq "0" "$(sed -n 3p "$TODO_FILE" | grep -c '^x ' || true)" \
	"bulk undo: id 3 re-opened"

# --- bulk with a bad id in the middle: nothing mutates ---------------------

before=$(cat "$TODO_FILE")
code=0
$HW complete 1 99 2 >/dev/null 2>&1 || code=$?
assert_exit_code "1" "$code" "bulk complete: bad id aborts with exit 1"
after=$(cat "$TODO_FILE")
assert_eq "$before" "$after" "bulk complete: bad id leaves file unchanged"

# --- bulk delete: out-of-order args deleted in descending order ------------

: >"$TODO_FILE"
for i in 1 2 3 4 5; do $HW add "task $i" >/dev/null; done

$HW -y delete 2 4 >/dev/null
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

# --- -y / --yes: no prompt, both spellings work ----------------------------

: >"$TODO_FILE"
$HW add "throwaway" >/dev/null
# CONFIRM_DELETE unset (defaults to true), stdin is /dev/null -> without -y
# the prompt would read EOF and cancel.
code=0
out=$(CONFIRM_DELETE=true $HW -y delete 1 </dev/null 2>&1) || code=$?
assert_exit_code "0" "$code" "-y delete: succeeds with confirmation defaulted on"
assert_match "^deleted 1:" "$out" "-y delete: reports deletion"
assert_eq "0" "$(awk 'END { print NR }' "$TODO_FILE")" "-y delete: file emptied"

$HW add "throwaway two" >/dev/null
code=0
out=$(CONFIRM_DELETE=true $HW --yes delete 1 </dev/null 2>&1) || code=$?
assert_exit_code "0" "$code" "--yes delete: long-form also skips prompt"

# Without -y, EOF on stdin cancels the delete (safe default).
$HW add "keep me" >/dev/null
code=0
out=$(CONFIRM_DELETE=true $HW delete 1 </dev/null 2>&1) || code=$?
assert_exit_code "0" "$code" "delete: cancelled prompt exits 0"
assert_match "cancelled" "$out" "delete: cancellation is announced"
assert_eq "1" "$(awk 'END { print NR }' "$TODO_FILE")" "delete: cancellation leaves task intact"

# -y works at any position (before OR after the command).
$HW delete 1 --yes </dev/null >/dev/null 2>&1
assert_eq "0" "$(awk 'END { print NR }' "$TODO_FILE")" "-y after subcommand: still recognized"

# --- show <id>: labelled detail block --------------------------------------

: >"$TODO_FILE"
$HW add "Draft the Q3 plan +Apollo due:2026-07-15 @deepwork" >/dev/null
$HW priority 1 A >/dev/null
show_out=$($HW show 1)
assert_match "^id:         1" "$show_out" "show: id line"
assert_match "^status:     open" "$show_out" "show: status open"
assert_match "^priority:   A" "$show_out" "show: priority pulled from (A)"
assert_match "^desc:       Draft the Q3 plan" "$show_out" "show: description"
assert_match "^project:    \+Apollo" "$show_out" "show: project"
assert_match "^tags:       @deepwork" "$show_out" "show: tag"
assert_match "^due:        2026-07-15" "$show_out" "show: due"

$HW -y delete 1 </dev/null >/dev/null 2>&1

# show on a completed task pulls priority from pri: and reports status=done.
$HW add "Simple task" >/dev/null
$HW complete 1 >/dev/null
show_out=$($HW show 1)
assert_match "^status:     done" "$show_out" "show: completed task shows status=done"
assert_match "^completed:  " "$show_out" "show: completion date present"

# --- project: unified view (+X) and set (<id> +X | none) -------------------

: >"$TODO_FILE"
$HW add "in project +Apollo" >/dev/null
$HW add "no project yet" >/dev/null

# view mode still works
view_out=$($HW project +Apollo)
assert_match "in project" "$view_out" "project +X: view lists Apollo tasks"

# set mode replaces cmd_move
$HW project 2 +Apollo >/dev/null
line2=$(sed -n 2p "$TODO_FILE")
assert_match "\+Apollo" "$line2" "project <id> +X: task assigned"

# none clears
$HW project 2 none >/dev/null
line2=$(sed -n 2p "$TODO_FILE")
assert_eq "0" "$(printf '%s\n' "$line2" | grep -c '+Apollo' || true)" \
	"project <id> none: project cleared"

# move as a command is gone (unknown command)
code=0
out=$($HW move 1 +Apollo 2>&1) || code=$?
assert_exit_code "2" "$code" "move: no longer a command"
assert_match "unknown command: move" "$out" "move: reported as unknown"

# rm as a command is gone
code=0
out=$($HW rm 1 2>&1) || code=$?
assert_exit_code "2" "$code" "rm: no longer a command"

# done as a command is gone
code=0
out=$($HW done 1 2>&1) || code=$?
assert_exit_code "2" "$code" "done: no longer a command"

teardown_sandbox
report_and_exit
