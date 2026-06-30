#!/bin/sh
# Tests for hw archive and hw stats.

set -eu

cd "$(dirname "$0")/.."
. tests/helpers.sh
setup_sandbox

HEADWAY_LIB_ONLY=true
. ./headway.sh
detect_date_flavor

cmd_add "Book flights to Lisbon" >/dev/null
cmd_add "Write project brief +Apollo due:2026-07-10" >/dev/null
cmd_add "Call the accountant due:today" >/dev/null
cmd_done 3 >/dev/null

# --- archive moves completed tasks out of TODO_FILE -------------------------

printf 'x 2026-01-01 2025-12-01 Pre-existing archived task\n' >"$DONE_FILE"

cmd_archive >/dev/null
remaining_count=$(awk 'END{print NR}' "$TODO_FILE")
assert_eq "2" "$remaining_count" "archive: completed task removed from TODO_FILE"
assert_eq "0" "$(grep -c '^x ' "$TODO_FILE" || true)" "archive: no completed lines remain in TODO_FILE"

done_count=$(awk 'END{print NR}' "$DONE_FILE")
assert_eq "2" "$done_count" "archive: DONE_FILE has pre-existing + newly archived task"
assert_match "Pre-existing archived task" "$(sed -n 1p "$DONE_FILE")" "archive: existing DONE_FILE content preserved"
assert_match "Call the accountant" "$(sed -n 2p "$DONE_FILE")" "archive: completed task appended to DONE_FILE"

# --- archive with nothing to archive is a clean no-op -----------------------

before=$(cat "$TODO_FILE")
out=$(cmd_archive)
after=$(cat "$TODO_FILE")
assert_eq "$before" "$after" "archive: no-op when nothing is completed"
assert_match "no completed tasks" "$out" "archive: prints a no-op message"

# --- stats: counts active/done totals and per-project ----------------------

stats_out=$(cmd_stats)
assert_match "2 active, 0 done \(2 total\)" "$stats_out" "stats: active/done totals (post-archive)"
assert_match "^projects:" "$stats_out" "stats: projects section header present"
assert_match "\+Apollo +1" "$stats_out" "stats: per-project count present"

teardown_sandbox
report_and_exit
