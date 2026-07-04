#!/bin/sh
# Tests for the outer surface: --help, --version, one-shot commands,
# invalid arguments, and per-command --help.

set -eu

cd "$(dirname "$0")/.."
. tests/helpers.sh
setup_sandbox

HW=./headway.sh

# --- outer surface: --version -----------------------------------------------

out=$($HW --version 2>&1)
code=$?
assert_exit_code "0" "$code" "--version: exit 0"
assert_match "^headway [0-9]+\.[0-9]+\.[0-9]+$" "$out" "--version: prints 'headway <semver>'"

# --- outer surface: --help --------------------------------------------------

code=0
out=$($HW --help 2>&1) || code=$?
assert_exit_code "0" "$code" "--help: exit 0"
assert_match "Usage: headway" "$out" "--help: prints usage"
assert_match "shell-based" "$out" "--help: frames headway as a shell"

# --- outer surface: one-shot commands --------------------------------------

code=0
out=$($HW add "Direct capture +CLI" 2>&1) || code=$?
assert_exit_code "0" "$code" "one-shot add: exit 0"
assert_match "added 1: .*Direct capture \+CLI" "$out" "one-shot add: prints confirmation"
assert_file_contains "$TODO_FILE" "Direct capture \+CLI" "one-shot add: writes TODO_FILE"

out=$($HW list 2>&1)
assert_match "^1: .*Direct capture \+CLI" "$out" "one-shot list: prints existing task"

out=$($HW add --help 2>&1)
assert_match "^usage: headway add" "$out" "one-shot add --help: prints command usage"

out=$($HW help 2>&1)
assert_match "Usage: headway" "$out" "one-shot help: prints top-level usage"

bad_conf="$SANDBOX/bad-config"
printf 'return 9\n' >"$bad_conf"
code=0
out=$(HEADWAY_CONFIG="$bad_conf" $HW help 2>&1) || code=$?
assert_exit_code "0" "$code" "one-shot help: ignores broken config"
assert_match "Usage: headway" "$out" "one-shot help with broken config: prints usage"

# --- outer surface: invalid flags/commands are rejected ---------------------

for bad in -h -v -V --yes -y foo; do
	code=0
	out=$($HW "$bad" 2>&1) || code=$?
	assert_exit_code "2" "$code" "$bad: rejected with exit 2"
	assert_match "unknown command: $bad" "$out" "$bad: names the unknown command"
done

code=0
out=$($HW dlete 1 2>&1) || code=$?
assert_exit_code "2" "$code" "one-shot typo: rejected with exit 2"
assert_match "did you mean 'delete'\\?" "$out" "one-shot typo: suggests near match"

code=0
out=$($HW exit 2>&1) || code=$?
assert_exit_code "2" "$code" "one-shot exit: rejected with exit 2"
assert_match "exit is only available inside the interactive shell" "$out" "one-shot exit: names shell-only command"

# --- outer surface: extra args after --help / --version also rejected ------

code=0
$HW --help extra >/dev/null 2>&1 || code=$?
assert_exit_code "2" "$code" "--help extra: exit 2"

code=0
$HW --version --help >/dev/null 2>&1 || code=$?
assert_exit_code "2" "$code" "--version --help: exit 2"

# --- in-shell: every command accepts --help --------------------------------

for cmd in add complete undo edit due priority tag clear delete show list inbox today \
	upcoming someday logbook projects project archive stats check; do
	out=$(printf '%s --help\nexit\n' "$cmd" | $HW 2>&1)
	assert_match "^usage: headway $cmd" "$out" "in-shell $cmd --help: prints subcommand usage"
done

# --- in-shell: -h is no longer a shortcut ----------------------------------

# `add -h` treats "-h" as task text (adds "-h" as a task), doesn't print help.
out=$(printf 'add -h\nlist\nexit\n' | $HW 2>&1)
assert_eq "0" "$(printf '%s\n' "$out" | grep -c '^usage: headway add' || true)" \
	"in-shell add -h: does not print help (no short-flag shortcut)"
assert_match "added [0-9]+: .*-h" "$out" "in-shell add -h: treats -h as task text"

# --- in-shell: usage errors exit 2 (via return code from shell subshell) ---
# The shell's REPL keeps running through failures, so we test by watching for
# the usage message and the absence of a false-success 'added' line.

out=$(printf 'add\nexit\n' | $HW 2>&1)
assert_match "usage: headway add" "$out" "in-shell add (no args): prints usage line"
assert_eq "0" "$(printf '%s\n' "$out" | grep -c '^added' || true)" \
	"in-shell add (no args): no false-success 'added' output"

# --- in-shell: unknown command → typo suggestion, no full-usage dump -------

out=$(printf 'dlete 1\nexit\n' | $HW 2>&1)
assert_match "unknown command: dlete" "$out" "in-shell typo: names input"
assert_match "did you mean 'delete'\\?" "$out" "in-shell typo: suggests near match"
assert_eq "0" "$(printf '%s\n' "$out" | grep -c 'Usage: headway' || true)" \
	"in-shell typo: no full-usage dump"

out=$(printf 'cler 1\nexit\n' | $HW 2>&1)
assert_match "unknown command: cler" "$out" "in-shell clear typo: names input"
assert_match "did you mean 'clear'\\?" "$out" "in-shell clear typo: suggests clear"

out=$(printf 'xyzzy\nexit\n' | $HW 2>&1)
assert_match "unknown command: xyzzy" "$out" "in-shell far typo: names input"
assert_eq "0" "$(printf '%s\n' "$out" | grep -c 'did you mean' || true)" \
	"in-shell far typo: no suggestion when nothing is close"

# --- in-shell: graceful empty-state when TODO_FILE does not exist ----------
# The sandbox already points TODO_FILE at a path; delete it and confirm
# id-referencing commands print the friendly hint instead of leaking awk.

rm -f "$TODO_FILE"
out=$(printf 'complete 5\nexit\n' | $HW 2>&1)
assert_match "no tasks yet" "$out" "in-shell complete on missing file: friendly hint"
assert_eq "0" "$(printf '%s\n' "$out" | grep -c 'awk:' || true)" \
	"in-shell complete on missing file: no raw awk error"

for cmd in undo edit due priority tag delete show; do
	rm -f "$TODO_FILE"
	case "$cmd" in
		due) args="1 2026-01-01" ;;
		priority) args="1 A" ;;
		tag) args="1 @x" ;;
		*) args="1" ;;
	esac
	out=$(printf '%s %s\nexit\n' "$cmd" "$args" | $HW 2>&1)
	assert_match "no tasks yet" "$out" "in-shell $cmd on missing file: friendly hint"
	assert_eq "0" "$(printf '%s\n' "$out" | grep -c 'awk:' || true)" \
		"in-shell $cmd on missing file: no raw awk error"
done

for field in due priority tags project; do
	rm -f "$TODO_FILE"
	out=$(printf 'clear %s 1\nexit\n' "$field" | $HW 2>&1)
	assert_match "no tasks yet" "$out" "in-shell clear $field on missing file: friendly hint"
	assert_eq "0" "$(printf '%s\n' "$out" | grep -c 'awk:' || true)" \
		"in-shell clear $field on missing file: no raw awk error"
done

teardown_sandbox
report_and_exit
