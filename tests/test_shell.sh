#!/bin/sh
# Tests for hw shell (the interactive REPL).

set -eu

cd "$(dirname "$0")/.."
. tests/helpers.sh
setup_sandbox

HEADWAY_LIB_ONLY=true
. ./headway.sh
load_config
detect_date_flavor

# --- multiple commands run in one session -----------------------------------

out=$(printf 'add "Buy milk +Errands due:2026-07-10"\nlist\nexit\n' | cmd_shell)
code=$?
assert_exit_code "0" "$code" "shell: exit code 0 after 'exit'"
assert_match "added 1: .*Buy milk \+Errands due:2026-07-10" "$out" "shell: add ran inside the session"
assert_match "1: .*Buy milk \+Errands" "$out" "shell: list ran inside the same session"

# --- 'quit' also ends the session cleanly ------------------------------------

teardown_sandbox
setup_sandbox
HEADWAY_LIB_ONLY=true
. ./headway.sh
load_config
detect_date_flavor

code=0
printf 'quit\n' | cmd_shell >/dev/null || code=$?
assert_exit_code "0" "$code" "shell: 'quit' ends the session cleanly"

# --- EOF (no exit/quit typed) also ends the session cleanly ------------------

code=0
printf '' | cmd_shell >/dev/null || code=$?
assert_exit_code "0" "$code" "shell: EOF ends the session cleanly"

# --- blank lines are skipped, not treated as commands ------------------------

out=$(printf '\n\nlist\n\nexit\n' | cmd_shell)
assert_eq "0" "$(printf '%s\n' "$out" | grep -c 'unknown command')" "shell: blank lines produce no errors"

# --- an invalid command doesn't kill the session ------------------------------

out=$(printf 'bogus\nadd "Still works"\nlist\nexit\n' | cmd_shell 2>&1)
assert_match "unknown command: bogus" "$out" "shell: invalid command is reported"
assert_match "added 1: .*Still works" "$out" "shell: session continues after an invalid command"
assert_match "1: .*Still works" "$out" "shell: list after the invalid command still sees the added task"

# --- quoted multi-word text is preserved as a single argument ---------------

teardown_sandbox
setup_sandbox
HEADWAY_LIB_ONLY=true
. ./headway.sh
load_config
detect_date_flavor

printf 'add "Write project brief +Apollo @deepwork"\nexit\n' | cmd_shell >/dev/null
assert_eq "1" "$(awk 'END{print NR}' "$TODO_FILE")" "shell: quoted add wrote exactly one line"
assert_file_contains "$TODO_FILE" "Write project brief \+Apollo @deepwork" "shell: quoted multi-word text stayed intact"

# --- input is tokenized, never evaluated as shell code -----------------------
# (regression: the REPL used to `eval "set -- $line"`, which expanded
# $VAR/`cmd`/$(cmd) in ordinary task text instead of storing it literally)

teardown_sandbox
setup_sandbox
HEADWAY_LIB_ONLY=true
. ./headway.sh
load_config
detect_date_flavor

code=0
out=$(printf 'add "Pay $5 for coffee"\nlist\nexit\n' | cmd_shell) || code=$?
assert_exit_code "0" "$code" "shell: literal \$5 in task text doesn't crash the session"
assert_match 'Pay \$5 for coffee' "$out" "shell: \$5 stored literally, not expanded"

teardown_sandbox
setup_sandbox
HEADWAY_LIB_ONLY=true
. ./headway.sh
load_config
detect_date_flavor

marker="$SANDBOX/pwned-backtick"
printf 'add "`touch %s`"\nexit\n' "$marker" | cmd_shell >/dev/null
if [ -e "$marker" ]; then
	fail "shell: backtick command substitution was executed"
else
	pass
fi
assert_file_contains "$TODO_FILE" 'touch .*pwned-backtick' "shell: backtick text stored literally"

teardown_sandbox
setup_sandbox
HEADWAY_LIB_ONLY=true
. ./headway.sh
load_config
detect_date_flavor

marker="$SANDBOX/pwned-dollar-paren"
printf 'add "$(touch %s)"\nexit\n' "$marker" | cmd_shell >/dev/null
if [ -e "$marker" ]; then
	fail "shell: \$() command substitution was executed"
else
	pass
fi
assert_file_contains "$TODO_FILE" 'touch .*pwned-dollar-paren' "shell: \$() text stored literally"

# --- an unterminated quote reports a parse error and keeps the session alive -

teardown_sandbox
setup_sandbox
HEADWAY_LIB_ONLY=true
. ./headway.sh
load_config
detect_date_flavor

out=$(printf 'add "oops\nadd "Still works"\nexit\n' | cmd_shell 2>&1)
assert_match "unterminated quote" "$out" "shell: unterminated quote is reported"
assert_match "added 1: .*Still works" "$out" "shell: session continues after an unterminated quote"

# --- a failing command inside the REPL doesn't print a false success --------
# (regression: `if ! (dispatch_cmd "$@"); then :; fi` silently disabled
# errexit inside the subshell, so a failed write still printed "added ...")

teardown_sandbox
setup_sandbox
HEADWAY_LIB_ONLY=true
. ./headway.sh
TODO_FILE="$SANDBOX/nonexistent-dir/todo.txt"
load_config
detect_date_flavor

out=$(printf 'add "should not save"\nexit\n' | cmd_shell 2>&1) || true
assert_eq "0" "$(printf '%s\n' "$out" | grep -c 'added')" "shell: a failed write reports no false success"
assert_eq "false" "$([ -e "$TODO_FILE" ] && echo true || echo false)" "shell: a failed write creates no file"

teardown_sandbox
report_and_exit
