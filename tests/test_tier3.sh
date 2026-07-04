#!/bin/sh
# Tests for Tier 3: relative-date hints, grouped list view, tab completion
# candidates and behavior.

set -eu

cd "$(dirname "$0")/.."
. tests/helpers.sh
setup_sandbox

HEADWAY_LIB_ONLY=true
. ./headway.sh
detect_date_flavor

# --- due-date hints: expected labels for the labelled window ----------------
# Exercised end-to-end through the rendered list, since the hint labels are
# computed inside the view awk pass (due_hint_label in HW_AWK_VIEWLIB).

t=$(today)
cmd_add "task m1 due:$(date_add_days "$t" -1)" >/dev/null
cmd_add "task p0 due:$t" >/dev/null
cmd_add "task p1 due:$(date_add_days "$t" 1)" >/dev/null
i=2
while [ "$i" -le 7 ]; do
	cmd_add "task p$i due:$(date_add_days "$t" "$i")" >/dev/null
	i=$((i + 1))
done
cmd_add "task m2 due:$(date_add_days "$t" -2)" >/dev/null
cmd_add "task p8 due:$(date_add_days "$t" 8)" >/dev/null
cmd_add "task p30 due:$(date_add_days "$t" 30)" >/dev/null

list_out=$(cmd_list)
assert_match "task m1 due:$(date_add_days "$t" -1) \\(yesterday\\)" "$list_out" "hint: yesterday"
assert_match "task p0 due:$t \\(today\\)" "$list_out" "hint: today"
assert_match "task p1 due:$(date_add_days "$t" 1) \\(tomorrow\\)" "$list_out" "hint: tomorrow"

# +2..+7: weekday name. Verify by comparing against date_weekday_name for
# each offset - the label is that weekday's lowercase name. At +7 (same
# weekday name as today) the label still appears - "monday" a week from
# Monday, not empty.
i=2
while [ "$i" -le 7 ]; do
	d=$(date_add_days "$t" "$i")
	expected=$(date_weekday_name "$d")
	assert_match "task p$i due:$d \\($expected\\)" "$list_out" "hint: +${i}d -> $expected"
	i=$((i + 1))
done

# Outside the labelled window: no hint - due:DATE ends the line.
assert_match "task m2 due:$(date_add_days "$t" -2)\$" "$list_out" "hint: -2d has no label"
assert_match "task p8 due:$(date_add_days "$t" 8)\$" "$list_out" "hint: +8d has no label"
assert_match "task p30 due:$(date_add_days "$t" 30)\$" "$list_out" "hint: +30d has no label"

# --- hints appear in view output alongside due:DATE ------------------------

teardown_sandbox
setup_sandbox
HEADWAY_LIB_ONLY=true
. ./headway.sh
detect_date_flavor

cmd_add "urgent" >/dev/null
cmd_add "not so urgent" >/dev/null
cmd_due 1 "$(today)" >/dev/null
cmd_due 2 "$(date_add_days "$(today)" 1)" >/dev/null

view_out=$(cmd_view today)
assert_match "due:$(today) \\(today\\)" "$view_out" "view: today hint in due-line"

# --- render_grouped_list: headers only when 2+ buckets are populated -------

teardown_sandbox
setup_sandbox
HEADWAY_LIB_ONLY=true
. ./headway.sh
detect_date_flavor

# All-inbox case: single bucket, no headers.
cmd_add "task A" >/dev/null
cmd_add "task B" >/dev/null
list_out=$(cmd_list)
assert_eq "0" "$(printf '%s\n' "$list_out" | grep -cE '^Overdue$|^Due today$|^Upcoming$|^Inbox$|^Someday$' || true)" \
	"grouped list: single bucket prints no headers"

# Mix of buckets: headers appear.
today_d=$(today)
yesterday_d=$(date_add_days "$today_d" -1)
future_d=$(date_add_days "$today_d" 10)
cmd_add "overdue" >/dev/null
cmd_add "due today" >/dev/null
cmd_add "future" >/dev/null
cmd_add "later +Home" >/dev/null
cmd_due 3 "$yesterday_d" >/dev/null
cmd_due 4 "$today_d" >/dev/null
cmd_due 5 "$future_d" >/dev/null

list_out=$(cmd_list)
assert_match "^Overdue$" "$list_out" "grouped list: Overdue header"
assert_match "^Due today$" "$list_out" "grouped list: Due today header"
assert_match "^Upcoming$" "$list_out" "grouped list: Upcoming header"
assert_match "^Inbox$" "$list_out" "grouped list: Inbox header (task A/B still inbox)"
assert_match "^Someday$" "$list_out" "grouped list: Someday header (project task has no due)"

# Filtered list stays flat (no headers).
filtered=$(cmd_list "overdue")
assert_eq "0" "$(printf '%s\n' "$filtered" | grep -cE '^Overdue$|^Due today$|^Upcoming$|^Inbox$|^Someday$' || true)" \
	"grouped list: filtered call renders flat"

# --- tab completion: commands / projects / tags ---------------------------

teardown_sandbox
setup_sandbox
HEADWAY_LIB_ONLY=true
. ./headway.sh
detect_date_flavor

cmd_add "alpha +Home @errand" >/dev/null
cmd_add "beta +Work @deepwork" >/dev/null

# Command completion: unique prefix fills and appends space.
_rli_before="co"; _rli_after=""
_rli_tab 2>/dev/null
assert_eq "complete " "$_rli_before" "tab: 'co' -> 'complete '"

# Command multi-match: buffer unchanged, output lists candidates on stderr.
_rli_before="c"; _rli_after=""
out=$(_rli_tab 2>&1)
assert_eq "c" "$_rli_before" "tab: 'c' leaves buffer unchanged (multi-match)"
assert_match "complete" "$out" "tab: 'c' lists complete"
assert_match "check" "$out" "tab: 'c' lists check"

# Project completion.
_rli_before="add +Ho"; _rli_after=""
_rli_tab 2>/dev/null
assert_eq "add +Home " "$_rli_before" "tab: '+Ho' -> '+Home '"

# Tag completion.
_rli_before="add @d"; _rli_after=""
_rli_tab 2>/dev/null
assert_eq "add @deepwork " "$_rli_before" "tab: '@d' -> '@deepwork '"

# No match: buffer unchanged.
_rli_before="xyz"; _rli_after=""
_rli_tab 2>/dev/null
assert_eq "xyz" "$_rli_before" "tab: no match leaves buffer alone"

# Non-first-token non-+/@ arg: skipped.
_rli_before="add hello"; _rli_after=""
_rli_tab 2>/dev/null
assert_eq "add hello" "$_rli_before" "tab: mid-arg word does not complete"

# Mid-line (cursor not at end): skipped.
_rli_before="co"; _rli_after="XX"
_rli_tab 2>/dev/null
assert_eq "co" "$_rli_before" "tab: mid-line (after non-empty) is a no-op"

# Empty partial: skipped (would flood).
_rli_before="add "; _rli_after=""
_rli_tab 2>/dev/null
assert_eq "add " "$_rli_before" "tab: empty partial is a no-op"

teardown_sandbox
report_and_exit
