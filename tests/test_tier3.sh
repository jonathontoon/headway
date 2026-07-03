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

# --- format_due_hint: expected labels for the labelled window --------------

t=$(today)
assert_eq "today"     "$(format_due_hint "$t")"                           "hint: today"
assert_eq "yesterday" "$(format_due_hint "$(date_add_days "$t" -1)")"     "hint: yesterday"
assert_eq "tomorrow"  "$(format_due_hint "$(date_add_days "$t" 1)")"      "hint: tomorrow"

# +2..+7: weekday name. Verify by comparing against date_weekday_name for
# each offset - the label is that weekday's lowercase name.
i=2
while [ "$i" -le 7 ]; do
	d=$(date_add_days "$t" "$i")
	expected=$(date_weekday_name "$d")
	assert_eq "$expected" "$(format_due_hint "$d")" "hint: +${i}d -> $expected"
	i=$((i + 1))
done

# The weekday one week out (same weekday name as today) still labels -
# "monday" a week from Monday, not empty.
plus7=$(date_add_days "$t" 7)
today_dow=$(date_weekday_name "$t")
assert_eq "$today_dow" "$(format_due_hint "$plus7")" "hint: today+7 uses same weekday name"

# Outside the labelled window: no hint.
assert_eq "" "$(format_due_hint "$(date_add_days "$t" -2)")" "hint: -2d has no label"
assert_eq "" "$(format_due_hint "$(date_add_days "$t" 8)")"  "hint: +8d has no label"
assert_eq "" "$(format_due_hint "$(date_add_days "$t" 30)")" "hint: +30d has no label"

# --- hints appear in view output alongside due:DATE ------------------------

teardown_sandbox
setup_sandbox
HEADWAY_LIB_ONLY=true
. ./headway.sh
detect_date_flavor

cmd_add "urgent" >/dev/null
cmd_add "not so urgent" >/dev/null
cmd_due 1 today >/dev/null
cmd_due 2 tomorrow >/dev/null

view_out=$(cmd_today)
assert_match "due:$(today) \\(today\\)" "$view_out" "view: today hint in due-line"

# --- render_grouped_list: headers only when 2+ buckets are populated -------

teardown_sandbox
setup_sandbox
HEADWAY_LIB_ONLY=true
. ./headway.sh
detect_date_flavor

# All-someday case: single bucket, no headers.
cmd_add "task A" >/dev/null
cmd_add "task B" >/dev/null
list_out=$(cmd_list)
assert_eq "0" "$(printf '%s\n' "$list_out" | grep -cE '^Overdue$|^Due today$|^Upcoming$|^Someday$' || true)" \
	"grouped list: single bucket prints no headers"

# Mix of buckets: headers appear.
today_d=$(today)
yesterday_d=$(date_add_days "$today_d" -1)
future_d=$(date_add_days "$today_d" 10)
cmd_add "overdue" >/dev/null
cmd_add "due today" >/dev/null
cmd_add "future" >/dev/null
cmd_due 3 "$yesterday_d" >/dev/null
cmd_due 4 today >/dev/null
cmd_due 5 "$future_d" >/dev/null

list_out=$(cmd_list)
assert_match "^Overdue$" "$list_out" "grouped list: Overdue header"
assert_match "^Due today$" "$list_out" "grouped list: Due today header"
assert_match "^Upcoming$" "$list_out" "grouped list: Upcoming header"
assert_match "^Someday$" "$list_out" "grouped list: Someday header (task A/B still someday)"

# Filtered list stays flat (no headers).
filtered=$(cmd_list "overdue")
assert_eq "0" "$(printf '%s\n' "$filtered" | grep -cE '^Overdue$|^Due today$|^Upcoming$|^Someday$' || true)" \
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
