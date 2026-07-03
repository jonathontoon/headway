#!/bin/sh
# Tests for --version, -h/--help on root and subcommands, exit code 2 for
# usage errors, "did you mean" typo suggestions, and graceful empty-state.

set -eu

cd "$(dirname "$0")/.."
. tests/helpers.sh
setup_sandbox

HW=./headway.sh

# --- --version / -v --------------------------------------------------------

out=$($HW --version 2>&1)
code=$?
assert_exit_code "0" "$code" "--version: exit 0"
assert_match "^headway [0-9]+\.[0-9]+\.[0-9]+$" "$out" "--version: prints 'headway <semver>'"

out=$($HW -v 2>&1)
assert_match "^headway [0-9]+\.[0-9]+\.[0-9]+$" "$out" "-v: same output"

out=$($HW -V 2>&1)
assert_match "^headway [0-9]+\.[0-9]+\.[0-9]+$" "$out" "-V: same output"

# --- -h/--help/help at root still work ------------------------------------

for flag in -h --help help; do
	code=0
	out=$($HW $flag 2>&1) || code=$?
	assert_exit_code "0" "$code" "root $flag: exit 0"
	assert_match "Usage: headway <command> \[arguments\]" "$out" "root $flag: prints usage"
done

# --- -h/--help on subcommands ----------------------------------------------

for cmd in add complete undo edit due priority tag delete show list inbox today \
	upcoming someday logbook projects project archive stats check; do
	for flag in -h --help; do
		code=0
		out=$($HW $cmd $flag 2>&1) || code=$?
		assert_exit_code "0" "$code" "$cmd $flag: exit 0"
		assert_match "^usage: headway $cmd" "$out" "$cmd $flag: prints subcommand usage"
	done
done

# `-h` must not add "--help" as a task, or move a task's due date, etc.
before=$(awk 'END { print NR }' "$TODO_FILE")
$HW add --help >/dev/null 2>&1
after=$(awk 'END { print NR }' "$TODO_FILE")
assert_eq "$before" "$after" "add --help: does not mutate TODO_FILE"

# --- usage errors exit 2 ---------------------------------------------------

code=0; (: >"$TODO_FILE"; $HW add >/dev/null 2>&1) || code=$?
assert_exit_code "2" "$code" "add (no args): exit 2 for usage error"

code=0; (: >"$TODO_FILE"; $HW complete >/dev/null 2>&1) || code=$?
assert_exit_code "2" "$code" "complete (no args): exit 2"

code=0; (: >"$TODO_FILE"; $HW due 1 >/dev/null 2>&1) || code=$?
assert_exit_code "2" "$code" "due (missing date): exit 2"

code=0; (: >"$TODO_FILE"; $HW priority >/dev/null 2>&1) || code=$?
assert_exit_code "2" "$code" "priority (no args): exit 2"

# Runtime errors stay at exit 1 (distinct from usage errors)
: >"$TODO_FILE"
$HW add "some task" >/dev/null
code=0; $HW complete abc >/dev/null 2>&1 || code=$?
assert_exit_code "1" "$code" "complete abc: runtime error stays exit 1"

# --- unknown command: exit 2 + typo suggestion -----------------------------

code=0
out=$($HW dlete 2>&1) || code=$?
assert_exit_code "2" "$code" "unknown command: exit 2"
assert_match "unknown command: dlete" "$out" "unknown command: names the input"
assert_match "did you mean 'delete'\\?" "$out" "unknown command: suggests near match"

# Bogus command with no close match: still exit 2, no suggestion line.
code=0
out=$($HW xyzzy 2>&1) || code=$?
assert_exit_code "2" "$code" "unknown command (no near match): exit 2"
assert_match "unknown command: xyzzy" "$out" "unknown command (no near match): names input"
assert_eq "0" "$(printf '%s\n' "$out" | grep -c 'did you mean')" \
	"unknown command (no near match): no 'did you mean' line"
assert_match "run 'headway help'" "$out" "unknown command: points at help"

# Unknown command no longer dumps the full usage block.
assert_eq "0" "$(printf '%s\n' "$out" | grep -c 'Usage: headway <command>')" \
	"unknown command: does not dump full usage"

# --- graceful empty-state when TODO_FILE does not exist --------------------

rm -f "$TODO_FILE"
code=0
out=$($HW complete 5 2>&1) || code=$?
assert_exit_code "1" "$code" "complete <id> on missing file: exit 1"
assert_match "no tasks yet" "$out" "complete <id> on missing file: friendly hint"
assert_eq "0" "$(printf '%s\n' "$out" | grep -c "awk:")" \
	"complete <id> on missing file: no raw awk error"

for cmd in undo edit due priority tag delete show; do
	# Give each command enough positional args to reach require_todo_file
	# without tripping the usage-error path first.
	case "$cmd" in
		due) args="1 2026-01-01" ;;
		priority) args="1 A" ;;
		tag) args="1 @x" ;;
		*) args="1" ;;
	esac
	code=0
	out=$($HW $cmd $args 2>&1) || code=$?
	assert_exit_code "1" "$code" "$cmd on missing file: exit 1"
	assert_match "no tasks yet" "$out" "$cmd on missing file: friendly hint"
	assert_eq "0" "$(printf '%s\n' "$out" | grep -c "awk:")" \
		"$cmd on missing file: no raw awk error"
done

# project <id> +X (set-mode) also goes through require_todo_file.
rm -f "$TODO_FILE"
code=0
out=$($HW project 1 +X 2>&1) || code=$?
assert_exit_code "1" "$code" "project <id> on missing file: exit 1"
assert_match "no tasks yet" "$out" "project <id> on missing file: friendly hint"

teardown_sandbox
report_and_exit
