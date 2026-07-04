#!/bin/sh
# Tests for hw check.

set -eu

cd "$(dirname "$0")/.."
. tests/helpers.sh
setup_sandbox

HEADWAY_LIB_ONLY=true
. ./headway.sh
load_config
detect_date_flavor

# --- a well-formed file is clean --------------------------------------------

cmd_add "Book flights to Lisbon" >/dev/null
cmd_add "Write project brief +Apollo due:2026-07-10 @deepwork" >/dev/null
cmd_complete 2 >/dev/null

code=0
out=$(cmd_check 2>/dev/null) || code=$?
assert_exit_code "0" "$code" "check: well-formed file is clean"
assert_eq "TODO_FILE is well-formed" "$out" "check: clean file prints a success message"

# --- a problematic file is flagged ------------------------------------------

teardown_sandbox
setup_sandbox
HEADWAY_LIB_ONLY=true
. ./headway.sh
load_config
detect_date_flavor

cat >"$TODO_FILE" <<'EOF'
2026-06-29 A well-formed task

(a) 2026-06-29 lowercase priority is malformed
(AB) 2026-06-29 multi-char priority is malformed
2026-06-29 Bad due date due:not-a-date
2026-06-29 Bad repeat repeat:fortnightly
x 2026-06-29 missing the creation date
x missing both dates entirely
EOF

err_out=$( (cmd_check >/dev/null) 2>&1) || code=$?
assert_exit_code "1" "$code" "check: dirty file exits non-zero"

assert_match "^headway: line 2: blank line" "$err_out" "check: blank line flagged"
assert_match "^headway: line 3: malformed priority marker" "$err_out" "check: lowercase priority flagged"
assert_match "^headway: line 4: malformed priority marker" "$err_out" "check: multi-char priority flagged"
assert_match "^headway: line 5: invalid due date: not-a-date" "$err_out" "check: invalid due date flagged"
assert_match "^headway: line 6: invalid repeat value: fortnightly" "$err_out" "check: invalid repeat value flagged"
assert_match "^headway: line 7: completed task missing creation date" "$err_out" "check: missing creation date flagged"
assert_match "^headway: line 8: completed task missing completion date" "$err_out" "check: missing completion date flagged"
assert_match "^headway: 7 problems found$" "$err_out" "check: summary line counts every problem"

# --- COLOR=true: the "line N" locator is dimmed, the message is not --------

esc=$(printf '\033')
color_out=$( (COLOR=true; cmd_check >/dev/null) 2>&1) || true

case "$color_out" in
*"headway: ${esc}[2mline 2${esc}[0m: blank line"*) pass ;;
*) fail "check: COLOR=true dims the line locator via THEME_DATE" ;;
esac

teardown_sandbox
report_and_exit
