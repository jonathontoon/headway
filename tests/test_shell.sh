#!/bin/sh
# Tests for hw shell (the interactive REPL).
# shellcheck disable=SC2016

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

# --- EOF (no exit typed) also ends the session cleanly ------------------

teardown_sandbox
setup_sandbox
HEADWAY_LIB_ONLY=true
. ./headway.sh
load_config
detect_date_flavor

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

# --- welcome banner: nothing due --------------------------------------------

teardown_sandbox
setup_sandbox
HEADWAY_LIB_ONLY=true
. ./headway.sh
COLOR=false
SHOW_IDS=true
load_config
detect_date_flavor

cmd_add "Write project brief +Apollo" >/dev/null
cmd_add "Plan launch" >/dev/null
out=$(shell_welcome_banner)
assert_match "^headway v0\\.1\\.0" "$out" "welcome: version is first"
assert_match "Good (morning|afternoon|evening)!" "$out" "welcome: greeting is on its own line"
assert_match "2 open tasks, nothing due today\\." "$out" "welcome: nothing-due summary includes open count"
assert_eq "0" "$(printf '%s\n' "$out" | grep -c '^  [0-9][0-9]*:')" "welcome: no task list when nothing is due"
assert_match 'Type "help" for commands, "exit" to leave\.' "$out" "welcome: hint is present"

# --- welcome banner: one due group skips redundant group header --------------

teardown_sandbox
setup_sandbox
HEADWAY_LIB_ONLY=true
. ./headway.sh
COLOR=false
SHOW_IDS=true
load_config
detect_date_flavor

cmd_add "Call the accountant due:$(today) @calls" >/dev/null
out=$(shell_welcome_banner)
assert_match "1 task due\\." "$out" "welcome: singular due count"
assert_match "^  1: $(today) Call the accountant due:$(today) @calls" "$out" "welcome: due task uses view row format"
assert_eq "0" "$(printf '%s\n' "$out" | grep -c '^  Due today$')" "welcome: one non-empty group has no header"
assert_eq "0" "$(printf '%s\n' "$out" | grep -c '^  Overdue$')" "welcome: absent group has no header"

# --- welcome banner: SHOW_IDS=false follows view row formatting -------------

teardown_sandbox
setup_sandbox
HEADWAY_LIB_ONLY=true
. ./headway.sh
COLOR=false
SHOW_IDS=false
load_config
detect_date_flavor

cmd_add "No id please due:$(today)" >/dev/null
out=$(shell_welcome_banner)
assert_match "^  $(today) No id please due:$(today)$" "$out" "welcome: SHOW_IDS=false omits task id"
assert_eq "0" "$(printf '%s\n' "$out" | grep -c '^  1:')" "welcome: SHOW_IDS=false has no id prefix"

# --- welcome banner: both due groups, caps each group at three lines ---------

teardown_sandbox
setup_sandbox
HEADWAY_LIB_ONLY=true
. ./headway.sh
COLOR=false
SHOW_IDS=true
load_config
detect_date_flavor

today_d=$(today)
yesterday_d=$(date_add_days "$today_d" -1)
cmd_add "Overdue one due:$yesterday_d" >/dev/null
cmd_add "Overdue two due:$yesterday_d" >/dev/null
cmd_add "Overdue three due:$yesterday_d" >/dev/null
cmd_add "Overdue four due:$yesterday_d" >/dev/null
cmd_add "Today one due:$today_d" >/dev/null
cmd_add "Today two due:$today_d" >/dev/null
cmd_add "Today three due:$today_d" >/dev/null
cmd_add "Today four due:$today_d" >/dev/null
out=$(shell_welcome_banner)
assert_match "8 tasks due\\." "$out" "welcome: due count combines overdue and due today"
assert_match "^  Overdue$" "$out" "welcome: overdue header appears when both groups are non-empty"
assert_match "^  Due today$" "$out" "welcome: due-today header appears when both groups are non-empty"
assert_eq "6" "$(printf '%s\n' "$out" | grep -c '^  [0-9][0-9]*:')" "welcome: due list is capped at three rows per group"
assert_eq "2" "$(printf '%s\n' "$out" | grep -c "^  … 1 more — see 'today'$")" "welcome: each overflowing group shows a more line"

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

# --- edit <id> <text> replaces the line directly, without opening $EDITOR ----

teardown_sandbox
setup_sandbox
HEADWAY_LIB_ONLY=true
. ./headway.sh
EDITOR="$(pwd)/tests/fixtures/does-not-exist.sh"
load_config
detect_date_flavor

out=$(printf 'add "Book flights"\nedit 1 2026-06-30 Book flights @Travel +Holiday\nlist\nexit\n' | cmd_shell 2>&1)
assert_match "edited 1: 2026-06-30 Book flights @Travel \+Holiday" "$out" "shell: edit with inline text replaces the line"
assert_match "1: 2026-06-30 Book flights @Travel \+Holiday" "$out" "shell: list reflects the inline edit"

# --- `main` with no arguments drops straight into the shell ------------------

teardown_sandbox
setup_sandbox
HEADWAY_LIB_ONLY=true
. ./headway.sh
load_config
detect_date_flavor

out=$(printf 'add "Buy milk +Errands due:2026-07-10"\nlist\nexit\n' | main)
code=$?
assert_exit_code "0" "$code" "main: no-args exit code 0 after 'exit'"
assert_match "added 1: .*Buy milk \+Errands due:2026-07-10" "$out" "main: no-args add ran inside the session"
assert_match "1: .*Buy milk \+Errands" "$out" "main: no-args list ran in the same session"

# --- `main help` and `main --version` still work at the outer level ---------

teardown_sandbox
setup_sandbox
HEADWAY_LIB_ONLY=true
. ./headway.sh

out=$(main help)
code=$?
assert_exit_code "0" "$code" "main help: exit code 0"
assert_match "Usage: headway" "$out" "main help: prints usage"

out=$(main --version)
code=$?
assert_exit_code "0" "$code" "main --version: exit code 0"
assert_match "^headway [0-9]+\\.[0-9]+\\.[0-9]+$" "$out" "main --version: prints 'headway <semver>'"

code=0
out=$(main --help 2>&1) || code=$?
assert_exit_code "2" "$code" "main --help: rejected with exit 2"
assert_match "unknown command: --help" "$out" "main --help: names unknown command"

# --- `main` can run one-shot commands --------------------------------------

teardown_sandbox
setup_sandbox
HEADWAY_LIB_ONLY=true
. ./headway.sh

code=0
out=$(main add "Direct main +CLI" 2>&1) || code=$?
assert_exit_code "0" "$code" "main add: exit code 0"
assert_match "added 1: .*Direct main \+CLI" "$out" "main add: runs one-shot command"
assert_file_contains "$TODO_FILE" "Direct main \+CLI" "main add: writes TODO_FILE"

out=$(main list)
assert_match "^1: .*Direct main \+CLI" "$out" "main list: sees one-shot add"

# --- outer CLI rejects invalid args/commands -------------------------------

code=0
out=$(main --help extra 2>&1) || code=$?
assert_exit_code "2" "$code" "main --help extra: usage error"
assert_match "unknown command: --help" "$out" "main --help extra: names unknown command"

for bad in -h -v -V --yes foo; do
	code=0
	out=$(main "$bad" 2>&1) || code=$?
	assert_exit_code "2" "$code" "main $bad: rejected with exit 2"
done

teardown_sandbox
report_and_exit
