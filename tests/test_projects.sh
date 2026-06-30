#!/bin/sh
# Tests for hw projects / hw project.

set -eu

cd "$(dirname "$0")/.."
. tests/helpers.sh
setup_sandbox

HEADWAY_LIB_ONLY=true
. ./headway.sh
detect_date_flavor

cmd_add "Book flights to Lisbon" >/dev/null
cmd_add "Write project brief +Apollo due:2026-07-10" >/dev/null
cmd_add "Follow up +Apollo" >/dev/null
cmd_add "Repaint the fence +HomeReno" >/dev/null
printf 'x %s %s Old completed task +Archived\n' "$(today)" "$(today)" >>"$TODO_FILE"

# --- projects: distinct, sorted, only from incomplete tasks ----------------

out=$(cmd_projects)
assert_eq "+Apollo
+HomeReno" "$out" "projects: distinct active projects, sorted, excludes done-only project"

# --- project: thin wrapper over list filtering ------------------------------

apollo_out=$(cmd_project "+Apollo")
assert_eq "2" "$(printf '%s\n' "$apollo_out" | wc -l | tr -d ' ')" "project: two tasks in +Apollo"
assert_match "Write project brief" "$apollo_out" "project: first +Apollo task present"
assert_match "Follow up" "$apollo_out" "project: second +Apollo task present"

code=0
(cmd_project "NotAProject" >/dev/null 2>&1) || code=$?
assert_exit_code "1" "$code" "project: rejects argument without leading +"

teardown_sandbox
report_and_exit
