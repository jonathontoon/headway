#!/bin/sh
# Tests for hw edit/due/project/priority/tag/delete.

set -eu

cd "$(dirname "$0")/.."
. tests/helpers.sh
setup_sandbox

HEADWAY_LIB_ONLY=true
. ./headway.sh
detect_date_flavor

# --- due: set/update -----------------------------------------------------

cmd_add "Renew library books" >/dev/null
cmd_due 1 2026-08-01 >/dev/null
line1=$(line_at 1)
assert_match "due:2026-08-01" "$line1" "due: literal date applied"

cmd_due 1 today >/dev/null
line1=$(line_at 1)
assert_match "due:$(today)" "$line1" "due: today shorthand resolves"

code=0
(cmd_due 1 not-a-date >/dev/null 2>&1) || code=$?
assert_exit_code "1" "$code" "due: invalid date is rejected"

# --- project <id> +X: replaces project membership --------------------------

cmd_add "Sketch the new logo +OldProject" >/dev/null
cmd_project 2 +Branding >/dev/null
line2=$(line_at 2)
assert_match "\+Branding" "$line2" "project <id>: new project present"
assert_eq "" "$(printf '%s\n' "$line2" | grep -o '+OldProject' || true)" "project <id>: old project removed"

code=0
(cmd_project 2 NotAProject >/dev/null 2>&1) || code=$?
assert_exit_code "1" "$code" "project <id>: rejects value without leading +"

# --- project <id> none: clears project --------------------------------------

cmd_project 2 none >/dev/null
line2=$(line_at 2)
assert_eq "" "$(printf '%s\n' "$line2" | grep -o '+Branding' || true)" "project <id> none: project cleared"

# Restore the project so subsequent tests reference the same task shape.
cmd_project 2 +Branding >/dev/null

# --- priority: set, clear, completed-task targets pri: ----------------------

cmd_add "Draft the quarterly report" >/dev/null
cmd_priority 3 A >/dev/null
line3=$(line_at 3)
assert_match "^\(A\) " "$line3" "priority: (A) applied to active task"

cmd_priority 3 none >/dev/null
line3=$(line_at 3)
assert_match "^[0-9]{4}-" "$line3" "priority: cleared, no (X) marker remains"

code=0
(cmd_priority 3 ZZ >/dev/null 2>&1) || code=$?
assert_exit_code "1" "$code" "priority: rejects multi-char value"

cmd_complete 3 >/dev/null
cmd_priority 3 B >/dev/null
line3=$(line_at 3)
assert_match "pri:B" "$line3" "priority: completed task gets pri: extension"
assert_match "^x " "$line3" "priority: completed task stays marked done"

# --- tag: idempotent add, remove via -@, clear via none ---------------------

cmd_add "Plan the offsite" >/dev/null
cmd_tag 4 @planning >/dev/null
line4=$(line_at 4)
assert_match "@planning" "$line4" "tag: tag added"

before_tag_line=$(line_at 4)
cmd_tag 4 @planning >/dev/null
after_tag_line=$(line_at 4)
assert_eq "$before_tag_line" "$after_tag_line" "tag: re-adding an existing tag is a no-op"

code=0
(cmd_tag 4 notatag >/dev/null 2>&1) || code=$?
assert_exit_code "1" "$code" "tag: rejects value without leading @/-@"

cmd_tag 4 @followup >/dev/null
cmd_tag 4 -@planning >/dev/null
line4=$(line_at 4)
assert_eq "" "$(printf '%s\n' "$line4" | grep -o '@planning' || true)" "tag -@: removes named tag"
assert_match "@followup" "$line4" "tag -@: leaves other tags intact"

cmd_tag 4 none >/dev/null
line4=$(line_at 4)
assert_eq "" "$(printf '%s\n' "$line4" | grep -oE '@[A-Za-z]+' || true)" "tag none: all tags cleared"

# --- due <id> none: clears due date ----------------------------------------

cmd_due 1 2026-08-15 >/dev/null
cmd_due 1 none >/dev/null
line1=$(line_at 1)
assert_eq "" "$(printf '%s\n' "$line1" | grep -o 'due:' || true)" "due none: due date cleared"

# --- delete: single, prompt-aware -------------------------------------------

before_count=$(awk 'END{print NR}' "$TODO_FILE")
target_line=$(line_at 1)
cmd_delete 1 >/dev/null
after_count=$(awk 'END{print NR}' "$TODO_FILE")
assert_eq "$((before_count - 1))" "$after_count" "delete: file shrinks by one line"
new_line1=$(line_at 1)
assert_eq "$(printf '%s' "$target_line" | grep -c 'Sketch the new logo' || true)" "0" "sanity: removed task is gone from line 1"
assert_match "Sketch the new logo" "$new_line1" "delete: subsequent task shifts up to id 1"

# --- edit: round trip through a fake $EDITOR ---------------------------------

cmd_add "Confirm dentist appointment" >/dev/null
last_id=$(awk 'END{print NR}' "$TODO_FILE")
before_edit=$(line_at "$last_id")
EDITOR="$(pwd)/tests/fixtures/fake_editor_append.sh"
cmd_edit "$last_id" >/dev/null
after_edit=$(line_at "$last_id")
assert_eq "$before_edit EDITED" "$after_edit" "edit: fake editor's change is persisted"

EDITOR="$(pwd)/tests/fixtures/fake_editor_empty.sh"
code=0
(cmd_edit "$last_id" >/dev/null 2>&1) || code=$?
assert_exit_code "1" "$code" "edit: empty result aborts with non-zero exit"
unchanged=$(line_at "$last_id")
assert_eq "$after_edit" "$unchanged" "edit: empty result leaves task unchanged"

# --- edit: inline replacement text bypasses $EDITOR entirely ----------------
# EDITOR points at a nonexistent path, so if it were ever invoked the
# command would fail (exit 127 -> die) instead of succeeding.

EDITOR="$(pwd)/tests/fixtures/does-not-exist.sh"
code=0
cmd_edit "$last_id" 2026-06-30 Book flights @Travel +Holiday >/dev/null || code=$?
assert_exit_code "0" "$code" "edit: inline text succeeds without invoking \$EDITOR"
inline_result=$(line_at "$last_id")
assert_eq "2026-06-30 Book flights @Travel +Holiday" "$inline_result" "edit: inline text replaces the line verbatim"

teardown_sandbox
report_and_exit
