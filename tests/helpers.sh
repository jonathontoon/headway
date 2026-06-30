#!/bin/sh
# Shared assertion helpers + sandbox setup for headway test files.
# POSIX sh only - sourced by each tests/test_*.sh, which itself runs as
# its own `sh` subprocess (see run.sh) so globals never leak across files.

set -eu

PASS_COUNT=0
FAIL_COUNT=0

pass() {
	PASS_COUNT=$((PASS_COUNT + 1))
}

fail() {
	FAIL_COUNT=$((FAIL_COUNT + 1))
	printf '  FAIL: %s\n' "$1" >&2
}

assert_eq() {
	expected="$1"
	actual="$2"
	label="${3:-assert_eq}"
	if [ "$expected" = "$actual" ]; then
		pass
	else
		fail "$label: expected [$expected] got [$actual]"
	fi
}

assert_match() {
	pattern="$1"
	haystack="$2"
	label="${3:-assert_match}"
	if printf '%s\n' "$haystack" | grep -E -q "$pattern"; then
		pass
	else
		fail "$label: pattern [$pattern] not found in [$haystack]"
	fi
}

assert_exit_code() {
	expected="$1"
	actual="$2"
	label="${3:-assert_exit_code}"
	if [ "$expected" = "$actual" ]; then
		pass
	else
		fail "$label: expected exit [$expected] got [$actual]"
	fi
}

assert_file_contains() {
	file="$1"
	pattern="$2"
	label="${3:-assert_file_contains}"
	if [ -f "$file" ] && grep -E -q "$pattern" "$file"; then
		pass
	else
		fail "$label: [$file] does not contain pattern [$pattern]"
	fi
}

# setup_sandbox
# Creates an isolated tmp dir, points TODO_FILE/DONE_FILE inside it, and
# disables interactive prompts so tests run unattended.
setup_sandbox() {
	SANDBOX=$(mktemp -d)
	TODO_FILE="$SANDBOX/todo.txt"
	DONE_FILE="$SANDBOX/done.txt"
	HEADWAY_CONFIG="$SANDBOX/nonexistent-config"
	CONFIRM_DELETE=false
	export TODO_FILE DONE_FILE HEADWAY_CONFIG CONFIRM_DELETE
	: >"$TODO_FILE"
}

teardown_sandbox() {
	[ -n "${SANDBOX:-}" ] && rm -rf "$SANDBOX"
}

# report_and_exit
# Prints the pass/fail tally for this test file and exits non-zero if
# anything failed, so run.sh can aggregate results across subprocesses.
report_and_exit() {
	printf '  %d passed, %d failed\n' "$PASS_COUNT" "$FAIL_COUNT"
	[ "$FAIL_COUNT" -eq 0 ]
}
