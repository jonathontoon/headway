#!/bin/sh
# Unit-style tests for parse_line / format_line / resolve_id, exercised
# directly by sourcing headway.sh in library-only mode.

set -eu

cd "$(dirname "$0")/.."
. tests/helpers.sh

HEADWAY_LIB_ONLY=true
. ./headway.sh

# --- active task with priority, project, due, tag -------------------------

line='(A) 2026-06-29 Write landing page copy +LaunchBlog due:2026-07-04 @deepwork'
parse_line "$line"
assert_eq "false" "$P_DONE" "parse: done flag"
assert_eq "A" "$P_PRIORITY" "parse: priority"
assert_eq "2026-06-29" "$P_CREATION_DATE" "parse: creation date"
assert_eq "Write landing page copy" "$P_DESC" "parse: description"
assert_eq "+LaunchBlog" "$P_PROJECTS" "parse: projects"
assert_eq "@deepwork" "$P_TAGS" "parse: tags"
assert_eq "2026-07-04" "$P_DUE" "parse: due"
assert_eq "" "$P_REPEAT" "parse: repeat (absent)"
assert_eq "$line" "$(format_line)" "round-trip: active task"

# --- completed task with priority preserved as pri: -----------------------

cline='x 2026-07-04 2026-06-29 Write landing page copy +LaunchBlog pri:A'
parse_line "$cline"
assert_eq "true" "$P_DONE" "parse: done true"
assert_eq "2026-07-04" "$P_COMPLETION_DATE" "parse: completion date"
assert_eq "2026-06-29" "$P_CREATION_DATE" "parse: creation date (completed)"
assert_eq "" "$P_PRIORITY" "parse: no (A) position on completed line"
assert_eq "A" "$P_PRI_EXT" "parse: pri: extension"
assert_eq "$cline" "$(format_line)" "round-trip: completed task"

# --- multiple projects/tags + repeat ---------------------------------------

mline='2026-06-29 Pay rent +Home +Finance due:2026-07-01 @bills @recurring repeat:monthly'
parse_line "$mline"
assert_eq "+Home +Finance" "$P_PROJECTS" "parse: multiple projects"
assert_eq "@bills @recurring" "$P_TAGS" "parse: multiple tags"
assert_eq "monthly" "$P_REPEAT" "parse: repeat"
assert_eq "$mline" "$(format_line)" "round-trip: multi project/tag/repeat"

# --- bare task, no extensions ----------------------------------------------

bline='2026-06-29 Book flights to Lisbon'
parse_line "$bline"
assert_eq "Book flights to Lisbon" "$P_DESC" "parse: plain description"
assert_eq "" "$P_PROJECTS" "parse: no projects"
assert_eq "$bline" "$(format_line)" "round-trip: bare task"

# --- done/undo priority transform (not just raw round-trip) ---------------

parse_line '(B) 2026-06-29 Call the accountant @calls'
P_DONE=true
P_COMPLETION_DATE="2026-06-30"
P_PRI_EXT="$P_PRIORITY"
P_PRIORITY=""
assert_eq "x 2026-06-30 2026-06-29 Call the accountant @calls pri:B" "$(format_line)" "done: priority moved to pri:"

P_DONE=false
P_PRIORITY="$P_PRI_EXT"
P_PRI_EXT=""
P_COMPLETION_DATE=""
assert_eq "(B) 2026-06-29 Call the accountant @calls" "$(format_line)" "undo: priority restored to (B)"

# --- resolve_id -------------------------------------------------------------

TODO_FILE=$(mktemp)
printf 'task one\ntask two\ntask three\n' >"$TODO_FILE"

assert_eq "2" "$(resolve_id 2)" "resolve_id: valid id"

code=0
(resolve_id 99 >/dev/null 2>&1) || code=$?
assert_exit_code "1" "$code" "resolve_id: out of range"

code=0
(resolve_id abc >/dev/null 2>&1) || code=$?
assert_exit_code "1" "$code" "resolve_id: non-numeric"

rm -f "$TODO_FILE"

report_and_exit
