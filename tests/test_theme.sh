#!/bin/sh
# Tests for the color theme: use_color/use_color_err gating, colorize_line
# field wrapping, and THEME_* config precedence.
# shellcheck disable=SC2030,SC2031

set -eu

cd "$(dirname "$0")/.."
. tests/helpers.sh
setup_sandbox

HEADWAY_LIB_ONLY=true
. ./headway.sh
detect_date_flavor

esc=$(printf '\033')
conf_dir="$SANDBOX/conf"
mkdir -p "$conf_dir"

# --- use_color / use_color_err: COLOR=true / COLOR=false --------------------

result=$(
	COLOR=true
	code=0
	use_color || code=$?
	printf '%s\n' "$code"
)
assert_eq "0" "$result" "use_color: COLOR=true returns success"

result=$(
	COLOR=false
	code=0
	use_color || code=$?
	printf '%s\n' "$code"
)
assert_eq "1" "$result" "use_color: COLOR=false returns failure"

result=$(
	COLOR=true
	code=0
	use_color_err || code=$?
	printf '%s\n' "$code"
)
assert_eq "0" "$result" "use_color_err: COLOR=true returns success"

result=$(
	COLOR=false
	code=0
	use_color_err || code=$?
	printf '%s\n' "$code"
)
assert_eq "1" "$result" "use_color_err: COLOR=false returns failure"

# --- NO_COLOR: disables color while COLOR=auto, even on a tty --------------

result=$(
	COLOR=auto
	NO_COLOR=1
	code=0
	use_color || code=$?
	printf '%s\n' "$code"
)
assert_eq "1" "$result" "use_color: NO_COLOR set forces failure under COLOR=auto"

result=$(
	COLOR=auto
	NO_COLOR=1
	code=0
	use_color_err || code=$?
	printf '%s\n' "$code"
)
assert_eq "1" "$result" "use_color_err: NO_COLOR set forces failure under COLOR=auto"

# --- NO_COLOR: an explicit COLOR=true still overrides it --------------------

result=$(
	COLOR=true
	NO_COLOR=1
	code=0
	use_color || code=$?
	printf '%s\n' "$code"
)
assert_eq "0" "$result" "use_color: COLOR=true overrides NO_COLOR"

# --- COLOR=false: gated call site (cmd_add) stays plain, byte-for-byte ------

teardown_sandbox
setup_sandbox
HEADWAY_LIB_ONLY=true
. ./headway.sh
load_config
detect_date_flavor

COLOR=false
out=$(cmd_add "Buy milk +Errands @home due:2026-07-05")
assert_eq "added 1: $(today) Buy milk +Errands due:2026-07-05 @home" "$out" "COLOR=false: cmd_add output is plain"

# --- COLOR=true: colorize_line wraps priority/project/tag/due --------------

COLOR=true
line="(A) 2026-06-29 Write brief +Apollo due:2026-07-10 @deepwork"
colored=$(colorize_line "$line")

case "$colored" in
*"${esc}[1;33m(A)${esc}[0m"*) pass ;;
*) fail "colorize_line: priority (A) not wrapped in THEME_PRIORITY" ;;
esac
case "$colored" in
*"${esc}[36m+Apollo${esc}[0m"*) pass ;;
*) fail "colorize_line: +Apollo not wrapped in THEME_PROJECT" ;;
esac
case "$colored" in
*"${esc}[35m@deepwork${esc}[0m"*) pass ;;
*) fail "colorize_line: @deepwork not wrapped in THEME_TAG" ;;
esac
case "$colored" in
*"${esc}[1;31mdue:2026-07-10${esc}[0m"*) pass ;;
*) fail "colorize_line: due:2026-07-10 not wrapped in THEME_DUE" ;;
esac

# --- COLOR=true: completed line gets whole-line dim, not per-field ----------

done_line="x 2026-07-01 2026-06-01 Write brief +Apollo due:2026-07-10 @deepwork pri:A"
colored_done=$(colorize_line "$done_line")
esc_count=$(printf '%s' "$colored_done" | grep -o "$esc" | wc -l | tr -d ' ')
assert_eq "2" "$esc_count" "colorize_line: completed task has exactly one open+reset (whole-line dim)"
case "$colored_done" in
*"${esc}[2;9m${done_line}${esc}[0m"*) pass ;;
*) fail "colorize_line: completed line not wrapped in THEME_DONE as a whole" ;;
esac

# --- COLOR=true: cmd_show/cmd_stats/cmd_projects are themed too -------------

cmd_add "Write brief +Apollo due:2026-07-10 @deepwork" >/dev/null

show_out=$(COLOR=true cmd_show 2)
case "$show_out" in
*"${esc}[2mid:         ${esc}[0m"*) pass ;;
*) fail "cmd_show: label dimmed via THEME_DATE" ;;
esac
case "$show_out" in
*"${esc}[36m+Apollo${esc}[0m"*) pass ;;
*) fail "cmd_show: +Apollo project value still themed via THEME_PROJECT" ;;
esac

# cmd_projects while +Apollo is still open, before completing task 2 below
# (cmd_projects only lists projects on incomplete tasks).
projects_out=$(COLOR=true cmd_projects)
case "$projects_out" in
*"${esc}[36m+Apollo${esc}[0m"*) pass ;;
*) fail "cmd_projects: +Apollo wrapped in THEME_PROJECT" ;;
esac

cmd_complete 2 >/dev/null
show_out=$(COLOR=true cmd_show 2)
case "$show_out" in
*"${esc}[2mstatus:     ${esc}[0m${esc}[2;9mdone${esc}[0m"*) pass ;;
*) fail "cmd_show: value dimmed+struck via THEME_DONE once task is done" ;;
esac

stats_out=$(COLOR=true cmd_stats)
case "$stats_out" in
*"${esc}[2mtasks:    ${esc}[0m"*) pass ;;
*) fail "cmd_stats: label dimmed via THEME_DATE" ;;
esac

# --- THEME_PROJECT override: env var wins ------------------------------------

teardown_sandbox
setup_sandbox
HEADWAY_LIB_ONLY=true
. ./headway.sh

conf_dir="$SANDBOX/conf"
mkdir -p "$conf_dir"

result=$(
	THEME_PROJECT="4;95"
	HEADWAY_CONFIG="$SANDBOX/no-such-config"
	load_config
	printf '%s\n' "$THEME_PROJECT"
)
assert_eq "4;95" "$result" "theme: env THEME_PROJECT wins over built-in default"

# --- THEME_PROJECT override: config file wins over built-in default --------

cat >"$conf_dir/theme1" <<'EOF'
THEME_PROJECT=32
EOF

result=$(
	unset THEME_PROJECT
	HEADWAY_CONFIG="$conf_dir/theme1"
	load_config
	printf '%s\n' "$THEME_PROJECT"
)
assert_eq "32" "$result" "theme: config file value wins over built-in default"

# --- THEME_PROJECT override: env wins over a conflicting config file value -

result=$(
	THEME_PROJECT="4;95"
	HEADWAY_CONFIG="$conf_dir/theme1"
	load_config
	printf '%s\n' "$THEME_PROJECT"
)
assert_eq "4;95" "$result" "theme: env THEME_PROJECT wins over config file"

# --- built-in default applies when neither env nor file set it -------------

result=$(
	unset THEME_PROJECT
	HEADWAY_CONFIG="$SANDBOX/no-such-config"
	load_config
	printf '%s\n' "$THEME_PROJECT"
)
assert_eq "36" "$result" "theme: built-in default when no env and no file"

teardown_sandbox
report_and_exit
