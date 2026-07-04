#!/bin/sh
# headway - a minimal todo.txt CLI task manager.
#
# POSIX sh ONLY. Do not use bashisms: no arrays, no [[ ]], no local,
# no +=, no here-strings, no C-style for loops. This script must run
# unmodified under dash and BusyBox ash.
#
# shellcheck disable=SC2034

set -eu

HEADWAY_VERSION="0.1.0"

# ---------------------------------------------------------------------------
# Defaults
# ---------------------------------------------------------------------------

TODO_FILE_DEFAULT="$HOME/todo.txt"
DONE_FILE_DEFAULT="$HOME/done.txt"
EDITOR_DEFAULT="vi"
COLOR_DEFAULT="auto"
SHOW_IDS_DEFAULT="true"
CONFIRM_DELETE_DEFAULT="true"

# Theme: bare SGR parameter codes (no \033[ / m wrapper) applied when
# COLOR is active. THEME_DESC is intentionally empty (unstyled).
THEME_PRIORITY_DEFAULT="1;33"
THEME_PROJECT_DEFAULT="36"
THEME_TAG_DEFAULT="35"
THEME_DUE_DEFAULT="1;31"
THEME_DATE_DEFAULT="2"
THEME_DESC_DEFAULT=""
THEME_REPEAT_DEFAULT="1;34"
THEME_DONE_DEFAULT="2;9"
# ---------------------------------------------------------------------------
# Generic helpers
# ---------------------------------------------------------------------------

err() {
	printf 'headway: %s\n' "$1" >&2
}

die() {
	err "$1"
	exit 1
}

# usage_die <msg>
# Same shape as die() but exits 2 - the POSIX/GNU convention for usage
# errors ("you called headway wrong"), distinct from exit 1 for runtime
# errors ("headway understood you but the request could not be honoured").
# Scripts can branch on the two.
usage_die() {
	err "$1"
	exit 2
}

# headway_commands
# Command names recognized by the interactive shell. Kept in one place so
# typo suggestions and tab completion cannot drift from each other.
headway_commands() {
	printf '%s\n' "add complete undo edit due priority tag clear delete show list inbox today upcoming someday logbook projects project archive stats check help exit"
}

# require_todo_file
# Bails early with a friendly hint when TODO_FILE has never been created.
# Called from id-referencing commands (complete, undo, edit, due, priority,
# tag, clear, delete, show) where the alternative is a raw awk failure from
# resolve_id. Exits 1: the user pointed at a specific task that cannot
# exist in a nonexistent file, so this is a runtime error, not empty state.
require_todo_file() {
	if [ ! -f "$TODO_FILE" ]; then
		err "no tasks yet - try 'headway add \"...\"'"
		exit 1
	fi
}

# suggest_command <bad>
# Prints "did you mean '<X>'?" for the closest known command by edit
# distance, iff a good enough match exists (distance <= 2). Silent when
# nothing is close. Uses awk (POSIX-only features) so it stays inside the
# same portability envelope as the rest of the script.
suggest_command() {
	_sc_bad="$1"
	_sc_known=$(headway_commands)
	_sc_hit=$(printf '%s\n' "$_sc_bad" | awk -v known="$_sc_known" '
	function dist(s, t,    n, m, d, i, j, cost, mn) {
		n = length(s); m = length(t)
		if (n == 0) return m
		if (m == 0) return n
		for (i = 0; i <= n; i++) d[i,0] = i
		for (j = 0; j <= m; j++) d[0,j] = j
		for (i = 1; i <= n; i++) {
			for (j = 1; j <= m; j++) {
				cost = (substr(s,i,1) == substr(t,j,1)) ? 0 : 1
				mn = d[i-1,j] + 1
				if (d[i,j-1] + 1 < mn) mn = d[i,j-1] + 1
				if (d[i-1,j-1] + cost < mn) mn = d[i-1,j-1] + cost
				d[i,j] = mn
			}
		}
		return d[n,m]
	}
	{
		bad = $0
		n = split(known, cmds, " ")
		best = ""; best_score = 3
		for (i = 1; i <= n; i++) {
			s = dist(bad, cmds[i])
			if (s < best_score) { best_score = s; best = cmds[i] }
		}
		if (best != "") print best
	}')
	[ -n "$_sc_hit" ] && err "did you mean '$_sc_hit'?"
	return 0
}

# expand_tilde <value>
# Expands a single leading "~" or "~/..." to $HOME. Needed because a value
# arriving via an environment variable (rather than literally written in a
# sourced shell file) is never tilde-expanded by the shell automatically.
expand_tilde() {
	case "$1" in
	\~)
		printf '%s\n' "$HOME"
		;;
	\~/*)
		printf '%s\n' "$HOME/${1#\~/}"
		;;
	*)
		printf '%s\n' "$1"
		;;
	esac
}

# use_color
# Returns success (0) if colored output should be used, based on the
# COLOR config value ("auto"/"true"/"false"), the NO_COLOR convention
# (https://no-color.org - any non-empty value disables color while
# COLOR=auto, though an explicit COLOR=true still wins, same as a tool's
# own --color=always flag would), and whether stdout is a tty.
use_color() {
	case "${COLOR:-auto}" in
	true) return 0 ;;
	false) return 1 ;;
	*)
		[ -z "${NO_COLOR:-}" ] || return 1
		[ -t 1 ]
		;;
	esac
}

# use_color_err
# Same as use_color(), but for output written to stderr (fd 2) - stdout
# and stderr can be redirected independently, so each needs its own tty
# check when COLOR=auto.
use_color_err() {
	case "${COLOR:-auto}" in
	true) return 0 ;;
	false) return 1 ;;
	*)
		[ -z "${NO_COLOR:-}" ] || return 1
		[ -t 2 ]
		;;
	esac
}

# safe_write <target-file>
# Reads the desired full file content from stdin and atomically replaces
# <target-file> with it. Never uses `sed -i` (GNU/BSD flag incompatibility);
# always writes to a fresh tempfile in the same directory as the target
# (so `mv` stays on one filesystem and is atomic) then moves it into place.
safe_write() {
	target="$1"
	tmp=$(mktemp "${target}.XXXXXX") || die "mktemp failed for $target"
	if ! cat >"$tmp"; then
		rm -f "$tmp"
		die "failed writing to tempfile for $target"
	fi
	if ! mv "$tmp" "$target"; then
		rm -f "$tmp"
		die "failed to replace $target"
	fi
}
# ---------------------------------------------------------------------------
# Date flavor detection
# ---------------------------------------------------------------------------

# detect_date_flavor
# Probes the installed `date` implementation once and sets DATE_FLAVOR to
# "gnu" or "bsd" so date arithmetic helpers can branch on it consistently.
detect_date_flavor() {
	if date -d "1 day" "+%Y-%m-%d" >/dev/null 2>&1; then
		DATE_FLAVOR="gnu"
	elif date -v+1d "+%Y-%m-%d" >/dev/null 2>&1; then
		DATE_FLAVOR="bsd"
	elif date -u -d "@0" "+%Y-%m-%d" >/dev/null 2>&1; then
		DATE_FLAVOR="busybox"
	else
		die "unsupported date(1) implementation: cannot detect GNU, BSD, or BusyBox flavor"
	fi
}

# today
# Prints today's date as YYYY-MM-DD. Flavor-independent: both GNU and BSD
# date support a bare `+FORMAT` invocation with no other arguments.
today() {
	date "+%Y-%m-%d"
}

# greeting
# Prints "Good morning"/"Good afternoon"/"Good evening" based on the local
# hour. Flavor-independent, same as today().
greeting() {
	hour=$(date "+%H")
	if [ "$hour" -lt 12 ]; then
		printf 'Good morning'
	elif [ "$hour" -lt 18 ]; then
		printf 'Good afternoon'
	else
		printf 'Good evening'
	fi
}

# date_weekday_name <YYYY-MM-DD>
# Prints the lowercase full weekday name (e.g. "monday", "sunday") for the
# given date. Flavor-specific because BSD `date` cannot parse a bare
# YYYY-MM-DD with `-d`, and BusyBox `date` needs the -u/-d combination.
date_weekday_name() {
	case "$DATE_FLAVOR" in
	gnu) date -d "$1" "+%A" | tr '[:upper:]' '[:lower:]' ;;
	bsd) date -j -f "%Y-%m-%d" "$1" "+%A" | tr '[:upper:]' '[:lower:]' ;;
	busybox) date -u -d "$1" "+%A" | tr '[:upper:]' '[:lower:]' ;;
	esac
}

# date_to_day_number <YYYY-MM-DD>
# Converts a Gregorian calendar date to a day number using integer
# arithmetic only. Avoids spawning date(1) for display-only relative hints.
date_to_day_number() {
	_dtdn_y=${1%%-*}
	_dtdn_rest=${1#*-}
	_dtdn_m=${_dtdn_rest%%-*}
	_dtdn_d=${_dtdn_rest#*-}
	_dtdn_y=${_dtdn_y#0}
	_dtdn_m=${_dtdn_m#0}
	_dtdn_d=${_dtdn_d#0}
	[ -n "$_dtdn_m" ] || _dtdn_m=0
	[ -n "$_dtdn_d" ] || _dtdn_d=0

	if [ "$_dtdn_m" -le 2 ]; then
		_dtdn_y=$((_dtdn_y - 1))
	fi
	_dtdn_era=$((_dtdn_y / 400))
	_dtdn_yoe=$((_dtdn_y - _dtdn_era * 400))
	if [ "$_dtdn_m" -gt 2 ]; then
		_dtdn_mp=$((_dtdn_m - 3))
	else
		_dtdn_mp=$((_dtdn_m + 9))
	fi
	_dtdn_doy=$(((153 * _dtdn_mp + 2) / 5 + _dtdn_d - 1))
	_dtdn_doe=$((_dtdn_yoe * 365 + _dtdn_yoe / 4 - _dtdn_yoe / 100 + _dtdn_doy))
	printf '%s\n' $((_dtdn_era * 146097 + _dtdn_doe - 719468))
}

weekday_name_from_day_number() {
	_wnd_idx=$((($1 + 4) % 7))
	case "$_wnd_idx" in
	0) printf 'sunday\n' ;;
	1) printf 'monday\n' ;;
	2) printf 'tuesday\n' ;;
	3) printf 'wednesday\n' ;;
	4) printf 'thursday\n' ;;
	5) printf 'friday\n' ;;
	*) printf 'saturday\n' ;;
	esac
}

weekday_index() {
	case "$1" in
	sunday) printf '0\n' ;;
	monday) printf '1\n' ;;
	tuesday) printf '2\n' ;;
	wednesday) printf '3\n' ;;
	thursday) printf '4\n' ;;
	friday) printf '5\n' ;;
	saturday) printf '6\n' ;;
	*) return 1 ;;
	esac
}

next_weekday_date() {
	_nwd_target=$(weekday_index "$1") || return 1
	_nwd_today=$(today)
	_nwd_today_day=$(date_to_day_number "$_nwd_today")
	_nwd_today_idx=$(((_nwd_today_day + 4) % 7))
	_nwd_delta=$((_nwd_target - _nwd_today_idx))
	if [ "$_nwd_delta" -le 0 ]; then
		_nwd_delta=$((_nwd_delta + 7))
	fi
	date_add_days "$_nwd_today" "$_nwd_delta"
}

# format_due_hint <YYYY-MM-DD>
# Emits a short relative label for a due date compared to today. Returns:
#   "yesterday"           for due == today - 1
#   "today"               for due == today
#   "tomorrow"            for due == today + 1
#   "monday".."sunday"    for due in today+2..today+7 (the next occurrence
#                         of that weekday; when today's own weekday name
#                         would apply it points seven days out, never at
#                         today - "today" already covers same-day)
# Anything else: prints nothing.
#
# Display-only. Callers wrap the returned label in parens after due:DATE;
# the raw todo.txt is never touched.
format_due_hint() {
	_fdh_date="$1"
	_fdh_today="${HEADWAY_TODAY:-$(today)}"
	if [ "$_fdh_date" = "$_fdh_today" ]; then
		printf 'today\n'
		return 0
	fi

	_fdh_date_day=$(date_to_day_number "$_fdh_date") || return 0
	if [ -n "${HEADWAY_TODAY_DAY:-}" ]; then
		_fdh_today_day="$HEADWAY_TODAY_DAY"
	else
		_fdh_today_day=$(date_to_day_number "$_fdh_today") || return 0
	fi
	_fdh_delta=$((_fdh_date_day - _fdh_today_day))

	if [ "$_fdh_delta" -eq -1 ]; then
		printf 'yesterday\n'
		return 0
	fi
	if [ "$_fdh_delta" -eq 1 ]; then
		printf 'tomorrow\n'
		return 0
	fi
	if [ "$_fdh_delta" -ge 2 ] && [ "$_fdh_delta" -le 7 ]; then
		weekday_name_from_day_number "$_fdh_date_day"
		return 0
	fi
}

# bsd_signed_offset <offset>
# Prepends `+` to an unsigned offset so BSD `date -v` reads it as a delta
# rather than an absolute-field set (`-v1d` sets day-of-month to 1;
# `-v+1d` adds one day). Passes explicitly-signed offsets through
# unchanged.
bsd_signed_offset() {
	case "$1" in
	-* | +*) printf '%s\n' "$1" ;;
	*) printf '+%s\n' "$1" ;;
	esac
}

# date_add_days <YYYY-MM-DD> <signed-offset>
date_add_days() {
	base="$1"
	offset="$2"
	case "$DATE_FLAVOR" in
	gnu) date -d "$base + $offset day" "+%Y-%m-%d" ;;
	bsd)
		_dad_o=$(bsd_signed_offset "$offset")
		date -j -v"${_dad_o}"d -f "%Y-%m-%d" "$base" "+%Y-%m-%d"
		;;
	busybox)
		_dad_epoch=$(date -u -d "$base" "+%s") || die "invalid date: $base"
		_dad_epoch=$((_dad_epoch + offset * 86400))
		date -u -d "@$_dad_epoch" "+%Y-%m-%d"
		;;
	esac
}

# date_add_months <YYYY-MM-DD> <signed-offset>
# Known v0 limitation: uses the underlying date tool's native month
# arithmetic as-is, with no end-of-month clamping.
date_add_months() {
	base="$1"
	offset="$2"
	case "$DATE_FLAVOR" in
	gnu) date -d "$base + $offset month" "+%Y-%m-%d" ;;
	bsd)
		_dam_o=$(bsd_signed_offset "$offset")
		date -j -v"${_dam_o}"m -f "%Y-%m-%d" "$base" "+%Y-%m-%d"
		;;
	busybox)
		_dam_y=${base%%-*}
		_dam_rest=${base#*-}
		_dam_m=${_dam_rest%%-*}
		_dam_d=${_dam_rest#*-}
		_dam_y=${_dam_y#0}
		_dam_m=${_dam_m#0}
		_dam_total=$(((_dam_y * 12 + (_dam_m - 1)) + offset))
		_dam_nm0=$((_dam_total % 12))
		_dam_ny=$((_dam_total / 12))
		if [ "$_dam_nm0" -lt 0 ]; then
			_dam_nm0=$((_dam_nm0 + 12))
			_dam_ny=$((_dam_ny - 1))
		fi
		_dam_nm=$((_dam_nm0 + 1))
		date -u -d "$(printf '%04d-%02d-%02d' "$_dam_ny" "$_dam_nm" "${_dam_d#0}")" "+%Y-%m-%d"
		;;
	esac
}

# date_add_years <YYYY-MM-DD> <signed-offset>
date_add_years() {
	base="$1"
	offset="$2"
	case "$DATE_FLAVOR" in
	gnu) date -d "$base + $offset year" "+%Y-%m-%d" ;;
	bsd)
		_day_o=$(bsd_signed_offset "$offset")
		date -j -v"${_day_o}"y -f "%Y-%m-%d" "$base" "+%Y-%m-%d"
		;;
	busybox)
		_day_y=${base%%-*}
		_day_rest=${base#*-}
		_day_m=${_day_rest%%-*}
		_day_d=${_day_rest#*-}
		_day_ny=$((${_day_y#0} + offset))
		date -u -d "$(printf '%04d-%02d-%02d' "$_day_ny" "${_day_m#0}" "${_day_d#0}")" "+%Y-%m-%d"
		;;
	esac
}

# is_valid_date <value>
# Validates strict YYYY-MM-DD shape and that the date tool accepts it.
is_valid_date() {
	case "$1" in
	[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]) ;;
	*) return 1 ;;
	esac
	case "$DATE_FLAVOR" in
	gnu) date -d "$1" >/dev/null 2>&1 ;;
	bsd) date -j -f "%Y-%m-%d" "$1" >/dev/null 2>&1 ;;
	busybox) date -u -d "$1" >/dev/null 2>&1 ;;
	esac
}

# validate_due_date <value>
# Resolves allowed date words (today, tomorrow, weekday names) or validates a
# literal YYYY-MM-DD date. Numeric relative forms are deliberately rejected so
# TODO_FILE only ever stores explicit dates.
validate_due_date() {
	input="$1"
	case "$input" in
	today)
		today
		;;
	tomorrow)
		date_add_days "$(today)" 1
		;;
	sunday | monday | tuesday | wednesday | thursday | friday | saturday)
		next_weekday_date "$input"
		;;
	[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9])
		if is_valid_date "$input"; then
			printf '%s\n' "$input"
		else
			die "invalid date: $input"
		fi
		;;
	*)
		die "invalid date: $input"
		;;
	esac
}
# ---------------------------------------------------------------------------
# Config loading
# ---------------------------------------------------------------------------

# load_config
# Precedence (highest wins): environment variables > config file >
# built-in defaults. The config file is a local file the user controls
# (same trust model as ~/.bashrc), so it is dot-sourced directly rather
# than defensively parsed. Because sourcing it runs its assignments
# unconditionally, an already-exported env var is snapshotted beforehand
# and restored afterward - otherwise the file would always win instead
# of the environment.
load_config() {
	config_path="${HEADWAY_CONFIG:-$HOME/.config/headway/config}"

	_lc_had_todo=${TODO_FILE+x}
	_lc_env_todo=${TODO_FILE-}
	_lc_had_done=${DONE_FILE+x}
	_lc_env_done=${DONE_FILE-}
	_lc_had_editor=${EDITOR+x}
	_lc_env_editor=${EDITOR-}
	_lc_had_color=${COLOR+x}
	_lc_env_color=${COLOR-}
	_lc_had_ids=${SHOW_IDS+x}
	_lc_env_ids=${SHOW_IDS-}
	_lc_had_conf=${CONFIRM_DELETE+x}
	_lc_env_conf=${CONFIRM_DELETE-}
	_lc_had_tpri=${THEME_PRIORITY+x}
	_lc_env_tpri=${THEME_PRIORITY-}
	_lc_had_tproj=${THEME_PROJECT+x}
	_lc_env_tproj=${THEME_PROJECT-}
	_lc_had_ttag=${THEME_TAG+x}
	_lc_env_ttag=${THEME_TAG-}
	_lc_had_tdue=${THEME_DUE+x}
	_lc_env_tdue=${THEME_DUE-}
	_lc_had_tdate=${THEME_DATE+x}
	_lc_env_tdate=${THEME_DATE-}
	_lc_had_tdesc=${THEME_DESC+x}
	_lc_env_tdesc=${THEME_DESC-}
	_lc_had_trep=${THEME_REPEAT+x}
	_lc_env_trep=${THEME_REPEAT-}
	_lc_had_tdone=${THEME_DONE+x}
	_lc_env_tdone=${THEME_DONE-}

	if [ -f "$config_path" ]; then
		# shellcheck disable=SC1090
		. "$config_path"
	fi

	if [ -n "$_lc_had_todo" ]; then TODO_FILE="$_lc_env_todo"; fi
	if [ -n "$_lc_had_done" ]; then DONE_FILE="$_lc_env_done"; fi
	if [ -n "$_lc_had_editor" ]; then EDITOR="$_lc_env_editor"; fi
	if [ -n "$_lc_had_color" ]; then COLOR="$_lc_env_color"; fi
	if [ -n "$_lc_had_ids" ]; then SHOW_IDS="$_lc_env_ids"; fi
	if [ -n "$_lc_had_conf" ]; then CONFIRM_DELETE="$_lc_env_conf"; fi
	if [ -n "$_lc_had_tpri" ]; then THEME_PRIORITY="$_lc_env_tpri"; fi
	if [ -n "$_lc_had_tproj" ]; then THEME_PROJECT="$_lc_env_tproj"; fi
	if [ -n "$_lc_had_ttag" ]; then THEME_TAG="$_lc_env_ttag"; fi
	if [ -n "$_lc_had_tdue" ]; then THEME_DUE="$_lc_env_tdue"; fi
	if [ -n "$_lc_had_tdate" ]; then THEME_DATE="$_lc_env_tdate"; fi
	if [ -n "$_lc_had_tdesc" ]; then THEME_DESC="$_lc_env_tdesc"; fi
	if [ -n "$_lc_had_trep" ]; then THEME_REPEAT="$_lc_env_trep"; fi
	if [ -n "$_lc_had_tdone" ]; then THEME_DONE="$_lc_env_tdone"; fi

	: "${TODO_FILE:=$TODO_FILE_DEFAULT}"
	: "${DONE_FILE:=$DONE_FILE_DEFAULT}"
	: "${EDITOR:=$EDITOR_DEFAULT}"
	: "${COLOR:=$COLOR_DEFAULT}"
	: "${SHOW_IDS:=$SHOW_IDS_DEFAULT}"
	: "${CONFIRM_DELETE:=$CONFIRM_DELETE_DEFAULT}"
	# THEME_DESC's default is intentionally empty ("" = unstyled) - this
	# still fills it in when unset, it just has nothing visible to set.
	: "${THEME_PRIORITY:=$THEME_PRIORITY_DEFAULT}"
	: "${THEME_PROJECT:=$THEME_PROJECT_DEFAULT}"
	: "${THEME_TAG:=$THEME_TAG_DEFAULT}"
	: "${THEME_DUE:=$THEME_DUE_DEFAULT}"
	: "${THEME_DATE:=$THEME_DATE_DEFAULT}"
	: "${THEME_DESC:=$THEME_DESC_DEFAULT}"
	: "${THEME_REPEAT:=$THEME_REPEAT_DEFAULT}"
	: "${THEME_DONE:=$THEME_DONE_DEFAULT}"

	TODO_FILE=$(expand_tilde "$TODO_FILE")
	DONE_FILE=$(expand_tilde "$DONE_FILE")
}
# ---------------------------------------------------------------------------
# Todo-line parsing / formatting
# ---------------------------------------------------------------------------

# US is the internal field delimiter used to pass parsed fields between the
# awk tokenizer and the shell. It is the ASCII unit separator (0x1F), which
# never legitimately appears in task text, and is never written to disk.
US=$(printf '\037')

# parse_line <raw todo.txt line>
# Sets globals: P_DONE, P_COMPLETION_DATE, P_PRIORITY, P_CREATION_DATE,
# P_DESC, P_PROJECTS, P_TAGS, P_DUE, P_REPEAT, P_PRI_EXT.
#
# The fixed-position prefix (done marker, priority, dates) and the
# free-form trailing tokens (+Project, @tag, due:, repeat:, pri:) are all
# classified in a single embedded awk pass, since awk's pattern matching
# and field splitting handle variable-length token soup far more reliably
# than shell-only string surgery.
parse_line() {
	_pl_line="$1"
	_pl_out=$(printf '%s\n' "$_pl_line" | awk '
	{
		line = $0
		done = "false"
		compdate = ""
		pri = ""
		credate = ""
		rest = line

		if (substr(rest, 1, 2) == "x ") {
			done = "true"
			rest = substr(rest, 3)
		}

		if (done == "false" && match(rest, /^\([A-Z]\) /)) {
			pri = substr(rest, 2, 1)
			rest = substr(rest, RLENGTH + 1)
		}

		if (done == "true") {
			if (match(rest, /^[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9] [0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9] /)) {
				compdate = substr(rest, 1, 10)
				rest = substr(rest, 12)
				credate = substr(rest, 1, 10)
				rest = substr(rest, 12)
			} else if (match(rest, /^[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9] /)) {
				compdate = substr(rest, 1, 10)
				rest = substr(rest, 12)
			}
		} else {
			if (match(rest, /^[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9] /)) {
				credate = substr(rest, 1, 10)
				rest = substr(rest, 12)
			}
		}

		desc = ""; projects = ""; tags = ""; due = ""; repeat = ""; prival = ""
		n = split(rest, toks, " ")
		for (i = 1; i <= n; i++) {
			t = toks[i]
			if (t == "") continue
			if (substr(t, 1, 1) == "+" && length(t) > 1) {
				projects = (projects == "" ? t : projects " " t)
			} else if (substr(t, 1, 1) == "@" && length(t) > 1) {
				tags = (tags == "" ? t : tags " " t)
			} else if (substr(t, 1, 4) == "due:") {
				due = substr(t, 5)
			} else if (substr(t, 1, 7) == "repeat:") {
				repeat = substr(t, 8)
			} else if (substr(t, 1, 4) == "pri:") {
				prival = substr(t, 5)
			} else {
				desc = (desc == "" ? t : desc " " t)
			}
		}

		us = "\037"
		print done us compdate us pri us credate us desc us projects us tags us due us repeat us prival
	}')

	IFS="$US" read -r P_DONE P_COMPLETION_DATE P_PRIORITY P_CREATION_DATE \
		P_DESC P_PROJECTS P_TAGS P_DUE P_REPEAT P_PRI_EXT <<EOF
$_pl_out
EOF
}

# format_line
# Reassembles the P_* globals (as set by parse_line, or populated directly)
# into a single canonical todo.txt line. Always emits fields in the same
# order, so output stays diff-stable regardless of input field order.
format_line() {
	_fl_out=""

	if [ "$P_DONE" = "true" ]; then
		_fl_out="x"
		[ -n "$P_COMPLETION_DATE" ] && _fl_out="$_fl_out $P_COMPLETION_DATE"
		[ -n "$P_CREATION_DATE" ] && _fl_out="$_fl_out $P_CREATION_DATE"
	else
		[ -n "$P_PRIORITY" ] && _fl_out="($P_PRIORITY)"
		if [ -n "$P_CREATION_DATE" ]; then
			_fl_out="${_fl_out:+$_fl_out }$P_CREATION_DATE"
		fi
	fi

	[ -n "$P_DESC" ] && _fl_out="${_fl_out:+$_fl_out }$P_DESC"
	[ -n "$P_PROJECTS" ] && _fl_out="${_fl_out:+$_fl_out }$P_PROJECTS"
	[ -n "$P_DUE" ] && _fl_out="${_fl_out:+$_fl_out }due:$P_DUE"
	[ -n "$P_TAGS" ] && _fl_out="${_fl_out:+$_fl_out }$P_TAGS"
	[ -n "$P_REPEAT" ] && _fl_out="${_fl_out:+$_fl_out }repeat:$P_REPEAT"
	if [ "$P_DONE" = "true" ] && [ -n "$P_PRI_EXT" ]; then
		_fl_out="${_fl_out:+$_fl_out }pri:$P_PRI_EXT"
	fi

	printf '%s\n' "$_fl_out"
}

# sgr_wrap <sgr-code> <text>
# Wraps <text> in the given ANSI SGR escape (and a reset), or prints it
# unwrapped if <sgr-code> is empty (e.g. THEME_DESC's default).
sgr_wrap() {
	_sw_code="$1"
	_sw_text="$2"
	if [ -n "$_sw_code" ]; then
		printf '\033[%sm%s\033[0m' "$_sw_code" "$_sw_text"
	else
		printf '%s' "$_sw_text"
	fi
}

# colorize_line <raw-line>
# Returns a display-only colorized rendering of a todo.txt line, built
# from the same P_* fields parse_line/format_line use. Never writes
# anything to disk - callers gate this behind use_color()/use_color_err()
# and only use the result for what's printed to the terminal. Completed
# tasks are dimmed as a whole (matching the todo.txt convention of
# receding done items as a group) rather than colored field-by-field.
colorize_line() {
	parse_line "$1"

	if [ "$P_DONE" = "true" ]; then
		_cl_plain=$(format_line)
		sgr_wrap "$THEME_DONE" "$_cl_plain"
		printf '\n'
		return 0
	fi

	_cl_out=""
	[ -n "$P_PRIORITY" ] && _cl_out="$(sgr_wrap "$THEME_PRIORITY" "($P_PRIORITY)")"
	if [ -n "$P_CREATION_DATE" ]; then
		_cl_out="${_cl_out:+$_cl_out }$(sgr_wrap "$THEME_DATE" "$P_CREATION_DATE")"
	fi
	[ -n "$P_DESC" ] && _cl_out="${_cl_out:+$_cl_out }$(sgr_wrap "$THEME_DESC" "$P_DESC")"

	if [ -n "$P_PROJECTS" ]; then
		_cl_projects=""
		for tok in $P_PROJECTS; do
			_cl_projects="${_cl_projects:+$_cl_projects }$(sgr_wrap "$THEME_PROJECT" "$tok")"
		done
		_cl_out="${_cl_out:+$_cl_out }$_cl_projects"
	fi

	if [ -n "$P_DUE" ]; then
		_cl_out="${_cl_out:+$_cl_out }$(sgr_wrap "$THEME_DUE" "due:$P_DUE")"
	fi

	if [ -n "$P_TAGS" ]; then
		_cl_tags=""
		for tok in $P_TAGS; do
			_cl_tags="${_cl_tags:+$_cl_tags }$(sgr_wrap "$THEME_TAG" "$tok")"
		done
		_cl_out="${_cl_out:+$_cl_out }$_cl_tags"
	fi

	if [ -n "$P_REPEAT" ]; then
		_cl_out="${_cl_out:+$_cl_out }$(sgr_wrap "$THEME_REPEAT" "repeat:$P_REPEAT")"
	fi

	printf '%s\n' "$_cl_out"
}

# report_change <verb> <id> <raw-line>
# Prints the standard "<verb> <id>: <line>" confirmation that every
# mutating command emits on success, colorising the line when use_color
# is active. Single source of truth for that shape so `added`/`edited`/
# `deleted`/etc. all format identically.
report_change() {
	_rc_display="$3"
	use_color && _rc_display=$(colorize_line "$3")
	printf '%s %s: %s\n' "$1" "$2" "$_rc_display"
}

# resolve_id <id>
# Validates that <id> is a positive integer within the current line count
# of TODO_FILE. Task IDs are simply 1-indexed line numbers - they are NOT
# stable across edits (a delete/archive above an id shifts everything
# below it), matching the original todo.txt-cli convention.
resolve_id() {
	id="$1"
	case "$id" in
	'' | *[!0-9]*) die "invalid task id: $id" ;;
	esac
	total=$(awk 'END { print NR }' "$TODO_FILE")
	[ "$id" -ge 1 ] && [ "$id" -le "$total" ] || die "no such task: $id"
	printf '%s\n' "$id"
}

# line_at <id>
# Prints the raw line at 1-indexed line number <id> in TODO_FILE.
line_at() {
	sed -n "$1"p "$TODO_FILE"
}

# replace_line_at <id> <new-line>
# Atomically rewrites TODO_FILE with line number <id> replaced by
# <new-line>, leaving every other line untouched.
replace_line_at() {
	_rla_id="$1"
	_rla_new="$2"
	awk -v id="$_rla_id" -v newline="$_rla_new" '
	{ if (NR == id) print newline; else print $0 }
	' "$TODO_FILE" | safe_write "$TODO_FILE"
}

# ---------------------------------------------------------------------------
# Listing / views
# ---------------------------------------------------------------------------

# collect_view_rows <which> [filter]
# Prints one "sortkey<TAB>id<TAB>due-or--<TAB>raw-line" row per matching task. <which> is
# one of: list, inbox, today, upcoming, someday, logbook.
collect_view_rows() {
	_cvr_which="$1"
	_cvr_filter="${2:-}"
	_cvr_today=$(today)
	_cvr_tab=$(printf '\t')
	awk -v which="$_cvr_which" -v filter="$_cvr_filter" -v today="$_cvr_today" -v tab="$_cvr_tab" '
	function parse(raw,    rest, toks, n, i, t) {
		done = "false"; compdate = ""; projects = ""; tags = ""; due = ""
		rest = raw

		if (substr(rest, 1, 2) == "x ") {
			done = "true"
			rest = substr(rest, 3)
		}

		if (done == "false" && match(rest, /^\([A-Z]\) /)) {
			rest = substr(rest, RLENGTH + 1)
		}

		if (done == "true") {
			if (match(rest, /^[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9] [0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9] /)) {
				compdate = substr(rest, 1, 10)
				rest = substr(rest, 23)
			} else if (match(rest, /^[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9] /)) {
				compdate = substr(rest, 1, 10)
				rest = substr(rest, 12)
			}
		} else if (match(rest, /^[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9] /)) {
			rest = substr(rest, 12)
		}

		n = split(rest, toks, " ")
		for (i = 1; i <= n; i++) {
			t = toks[i]
			if (t == "") continue
			if (substr(t, 1, 1) == "+" && length(t) > 1) {
				projects = (projects == "" ? t : projects " " t)
			} else if (substr(t, 1, 1) == "@" && length(t) > 1) {
				tags = (tags == "" ? t : tags " " t)
			} else if (substr(t, 1, 4) == "due:") {
				due = substr(t, 5)
			}
		}
	}
	function matches_filter(raw) {
		if (filter == "") return 1
		if (substr(filter, 1, 1) == "+" && length(filter) > 1) {
			return index(" " projects " ", " " filter " ") > 0
		}
		if (substr(filter, 1, 1) == "@" && length(filter) > 1) {
			return index(" " tags " ", " " filter " ") > 0
		}
		return index(raw, filter) > 0
	}
	{
		raw = $0
		if (raw == "") next
		parse(raw)

		if (which == "logbook") {
			if (done != "true") next
		} else if (done != "false") {
			next
		}

		if (which == "inbox") {
			if (due != "" || projects != "") next
		} else if (which == "today") {
			if (due == "" || due > today) next
		} else if (which == "upcoming") {
			if (due == "" || due <= today) next
		} else if (which == "someday") {
			if (due != "" || projects == "") next
		}

		if (!matches_filter(raw)) next

		if (which == "today" || which == "upcoming") sortkey = due
		else if (which == "logbook") sortkey = (compdate == "" ? "0000-00-00" : compdate)
		else sortkey = sprintf("%05d", NR)

		print sortkey tab NR tab (due == "" ? "-" : due) tab raw
	}
	' "$TODO_FILE"
}

# collect_grouped_rows
# Prints one "bucket<TAB>sortkey<TAB>id<TAB>due-or--<TAB>raw-line" row for
# every incomplete task, where bucket is ordered as:
#   1 Overdue, 2 Due today, 3 Upcoming, 4 Inbox, 5 Someday.
collect_grouped_rows() {
	_cgr_today="${1:-$(today)}"
	_cgr_tab=$(printf '\t')
	awk -v today="$_cgr_today" -v tab="$_cgr_tab" '
	function parse(raw,    rest, toks, n, i, t) {
		done = "false"; projects = ""; due = ""
		rest = raw

		if (substr(rest, 1, 2) == "x ") {
			done = "true"
			rest = substr(rest, 3)
		}

		if (done == "false" && match(rest, /^\([A-Z]\) /)) {
			rest = substr(rest, RLENGTH + 1)
		}

		if (done == "true") {
			if (match(rest, /^[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9] [0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9] /)) {
				rest = substr(rest, 23)
			} else if (match(rest, /^[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9] /)) {
				rest = substr(rest, 12)
			}
		} else if (match(rest, /^[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9] /)) {
			rest = substr(rest, 12)
		}

		n = split(rest, toks, " ")
		for (i = 1; i <= n; i++) {
			t = toks[i]
			if (t == "") continue
			if (substr(t, 1, 1) == "+" && length(t) > 1) {
				projects = (projects == "" ? t : projects " " t)
			} else if (substr(t, 1, 4) == "due:") {
				due = substr(t, 5)
			}
		}
	}
	{
		raw = $0
		if (raw == "") next
		parse(raw)
		if (done != "false") next

		if (due == "") {
			bucket = (projects == "" ? 4 : 5)
			sortkey = sprintf("%05d", NR)
		} else if (due < today) {
			bucket = 1
			sortkey = due
		} else if (due == today) {
			bucket = 2
			sortkey = due
		} else {
			bucket = 3
			sortkey = due
		}

		print bucket tab sortkey tab NR tab (due == "" ? "-" : due) tab raw
	}
	' "$TODO_FILE"
}

# emit_row <id> <raw-line> <use-color> [due-or--]
# Formats a single task row for display: applies colorize_line when
# use-color is "true", appends a relative hint when a due date is present,
# and honors SHOW_IDS. Shared by render_view and render_grouped_view so the
# two never drift.
emit_row() {
	_er_id="$1"
	_er_raw="$2"
	_er_use_color="$3"
	_er_due="${4:-}"

	if [ "$_er_use_color" = "true" ]; then
		_er_display=$(colorize_line "$_er_raw")
	else
		_er_display="$_er_raw"
	fi

	if [ -z "$_er_due" ]; then
		parse_line "$_er_raw"
		_er_due="${P_DUE:--}"
	fi
	[ "$_er_due" = "-" ] && _er_due=""

	_er_hint=""
	if [ -n "$_er_due" ]; then
		_er_h=$(format_due_hint "$_er_due")
		if [ -n "$_er_h" ]; then
			if [ "$_er_use_color" = "true" ]; then
				_er_hint=" $(sgr_wrap "$THEME_DATE" "($_er_h)")"
			else
				_er_hint=" ($_er_h)"
			fi
		fi
	fi

	if [ "${SHOW_IDS:-true}" = "false" ]; then
		printf '%s%s\n' "$_er_display" "$_er_hint"
	else
		printf '%s: %s%s\n' "$_er_id" "$_er_display" "$_er_hint"
	fi
}

bucket_header() {
	case "$1" in
	1) printf 'Overdue\n' ;;
	2) printf 'Due today\n' ;;
	3) printf 'Upcoming\n' ;;
	4) printf 'Inbox\n' ;;
	*) printf 'Someday\n' ;;
	esac
}

# render_view <which> [filter]
# Prints "<id>: <line>" for each task in view <which>, sorted ascending by
# sortkey (today/upcoming: due date; logbook: completion date, descending;
# everything else: file order).
render_view() {
	_rv_which="$1"
	_rv_filter="${2:-}"
	[ -f "$TODO_FILE" ] || return 0

	_rv_rows=$(collect_view_rows "$_rv_which" "$_rv_filter")
	[ -n "$_rv_rows" ] || return 0

	_rv_tab=$(printf '\t')
	case "$_rv_which" in
	logbook) _rv_sorted=$(printf '%s\n' "$_rv_rows" | sort -t "$_rv_tab" -k1,1 -r) ;;
	*) _rv_sorted=$(printf '%s\n' "$_rv_rows" | sort -t "$_rv_tab" -k1,1) ;;
	esac

	_rv_use_color=false
	use_color && _rv_use_color=true
	HEADWAY_TODAY=$(today)
	HEADWAY_TODAY_DAY=$(date_to_day_number "$HEADWAY_TODAY")

	printf '%s\n' "$_rv_sorted" | while IFS="$_rv_tab" read -r _ _rv_id _rv_due _rv_line; do
		emit_row "$_rv_id" "$_rv_line" "$_rv_use_color" "$_rv_due"
	done
}

# render_grouped_list
# Emits every incomplete task, bucketed into Overdue / Due today /
# Upcoming / Inbox / Someday sections. Section headers appear only when at least
# two buckets have content - a list that happens to be all-inbox,
# all-someday, or all-overdue still prints flat, unadorned, matching the
# pre-grouping behaviour so it doesn't feel over-decorated for the common case.
render_grouped_list() {
	[ -f "$TODO_FILE" ] || return 0

	_rgl_today=$(today)
	HEADWAY_TODAY="$_rgl_today"
	HEADWAY_TODAY_DAY=$(date_to_day_number "$HEADWAY_TODAY")
	_rgl_tab=$(printf '\t')
	_rgl_use_color=false
	use_color && _rgl_use_color=true

	_rgl_rows=$(collect_grouped_rows "$_rgl_today")
	[ -n "$_rgl_rows" ] || return 0
	_rgl_sorted=$(printf '%s\n' "$_rgl_rows" | sort -t "$_rgl_tab" -k1,1n -k2,2)
	_rgl_populated=$(printf '%s\n' "$_rgl_sorted" | awk -F "$_rgl_tab" 'NF && !seen[$1]++ { n++ } END { print n + 0 }')
	_rgl_show_headers=false
	[ "$_rgl_populated" -ge 2 ] && _rgl_show_headers=true

	_rgl_current=""
	printf '%s\n' "$_rgl_sorted" | while IFS="$_rgl_tab" read -r _rgl_bucket _ _rgl_rid _rgl_rdue _rgl_rline; do
		[ -n "$_rgl_bucket" ] || continue
		if [ "$_rgl_bucket" != "$_rgl_current" ]; then
			_rgl_header=$(bucket_header "$_rgl_bucket")
			if [ "$_rgl_show_headers" = "true" ]; then
				[ -n "$_rgl_current" ] && printf '\n'
				_rgl_h="$_rgl_header"
				[ "$_rgl_use_color" = "true" ] && _rgl_h=$(sgr_wrap "$THEME_DATE" "$_rgl_header")
				printf '%s\n' "$_rgl_h"
			fi
			_rgl_current="$_rgl_bucket"
		fi
		emit_row "$_rgl_rid" "$_rgl_rline" "$_rgl_use_color" "$_rgl_rdue"
	done
}
# ---------------------------------------------------------------------------
# Commands
# ---------------------------------------------------------------------------

# cmd_add <text> [+Project] [due:DATE] [@tag] [repeat:FREQ]
# Validates any due: date before writing, sets the creation date to today,
# and appends the new canonical line to TODO_FILE. Project/tag/due/repeat
# tokens may appear anywhere in <text>; everything else becomes the
# description.
cmd_add() {
	_u='usage: headway add "text [+Project] [due:DATE] [@tag]"'
	[ "$#" -ge 1 ] || usage_die "$_u"
	parse_line "$*"
	P_DONE=false
	P_PRIORITY=""
	P_PRI_EXT=""
	P_CREATION_DATE=$(today)
	if [ -n "$P_DUE" ]; then
		# explicit "|| exit 1" rather than relying on implicit set -e
		# propagation: -e is silently disabled for an entire command
		# (including nested command substitutions) whenever that
		# command is itself the LHS of &&/||/if/while in an ancestor
		# context, so callers further up the stack cannot be trusted
		# to preserve it.
		P_DUE=$(validate_due_date "$P_DUE") || exit 1
	fi
	[ -n "$P_DESC" ] || die "task description cannot be empty"

	new_line=$(format_line)
	printf '%s\n' "$new_line" >>"$TODO_FILE"
	id=$(awk 'END { print NR }' "$TODO_FILE")
	report_change "added" "$id" "$new_line"
}
# cmd_complete <id> [<id>...]
# Marks one or more tasks done: for each, priority (if any) moves to a
# trailing pri: extension, and the completion date is stamped alongside the
# original creation date. If a task carries repeat:daily|weekly|monthly|yearly,
# a new occurrence is appended with the due date advanced by one interval
# from the completed task's due date (today's date if it had none).
#
# When multiple ids are given they are all resolved (and validated as still
# open) before any are mutated - a later bad id aborts the whole batch, so
# the file is never left half-updated.
cmd_complete() {
	_u='usage: headway complete <id> [<id>...]'
	[ "$#" -ge 1 ] || usage_die "$_u"
	require_todo_file

	# Resolve and pre-validate every id first so a bad one in position N
	# doesn't leave positions 1..N-1 already applied.
	for _cc_arg in "$@"; do
		_cc_id=$(resolve_id "$_cc_arg") || exit 1
		parse_line "$(line_at "$_cc_id")"
		[ "$P_DONE" = "false" ] || die "task $_cc_id is already done"
	done

	for _cc_arg in "$@"; do
		id=$(resolve_id "$_cc_arg")
		raw=$(line_at "$id")
		parse_line "$raw"

		orig_priority="$P_PRIORITY"
		orig_due="$P_DUE"
		orig_repeat="$P_REPEAT"

		P_DONE=true
		P_COMPLETION_DATE=$(today)
		P_PRI_EXT="$orig_priority"
		P_PRIORITY=""
		completed_line=$(format_line)
		replace_line_at "$id" "$completed_line"
		report_change "completed" "$id" "$completed_line"

		next_due=""
		case "$orig_repeat" in
		daily) next_due=$(date_add_days "${orig_due:-$(today)}" 1) ;;
		weekly) next_due=$(date_add_days "${orig_due:-$(today)}" 7) ;;
		monthly) next_due=$(date_add_months "${orig_due:-$(today)}" 1) ;;
		yearly) next_due=$(date_add_years "${orig_due:-$(today)}" 1) ;;
		esac

		if [ -n "$next_due" ]; then
			P_DONE=false
			P_COMPLETION_DATE=""
			P_PRIORITY="$orig_priority"
			P_PRI_EXT=""
			P_CREATION_DATE=$(today)
			P_DUE="$next_due"
			next_line=$(format_line)
			printf '%s\n' "$next_line" >>"$TODO_FILE"
			next_id=$(awk 'END { print NR }' "$TODO_FILE")
			report_change "added" "$next_id" "$next_line"
		fi
	done
}

# cmd_undo <id> [<id>...]
# Reverses cmd_complete: restores the priority marker from pri: (if any) and
# clears the completion date. Byte-identical to the pre-done line. Accepts
# multiple ids; pre-validates all of them before mutating any.
cmd_undo() {
	_u='usage: headway undo <id> [<id>...]'
	[ "$#" -ge 1 ] || usage_die "$_u"
	require_todo_file

	for _cu_arg in "$@"; do
		_cu_id=$(resolve_id "$_cu_arg") || exit 1
		parse_line "$(line_at "$_cu_id")"
		[ "$P_DONE" = "true" ] || die "task $_cu_id is not done"
	done

	for _cu_arg in "$@"; do
		id=$(resolve_id "$_cu_arg")
		parse_line "$(line_at "$id")"

		P_DONE=false
		P_PRIORITY="$P_PRI_EXT"
		P_PRI_EXT=""
		P_COMPLETION_DATE=""
		new_line=$(format_line)
		replace_line_at "$id" "$new_line"
		report_change "undone" "$id" "$new_line"
	done
}
# cmd_edit <id> [text]
# With [text], replaces the task's line with it directly (verbatim, same
# as the $EDITOR path below - no due-date validation or field re-formatting).
# Without it, opens the task's raw line in $EDITOR via a
# scratch tempfile, then writes back whatever the editor leaves behind.
# Either way, an empty result aborts the edit (the task is left
# unchanged) rather than deleting the task.
cmd_edit() {
	_u='usage: headway edit <id> [text]'
	[ "$#" -ge 1 ] || usage_die "$_u"
	require_todo_file
	id=$(resolve_id "$1") || exit 1
	shift

	if [ "$#" -ge 1 ]; then
		new="$*"
	else
		raw=$(line_at "$id")
		tmp=$(mktemp) || die "mktemp failed"
		printf '%s\n' "$raw" >"$tmp"
		if ! $EDITOR "$tmp"; then
			rm -f "$tmp"
			die "editor exited non-zero, task $id unchanged"
		fi
		new=$(cat "$tmp")
		rm -f "$tmp"
	fi

	[ -n "$new" ] || die "empty edit aborted, task $id unchanged"
	replace_line_at "$id" "$new"
	report_change "edited" "$id" "$new"
}

# cmd_due <id> <DATE>
# DATE accepts YYYY-MM-DD, today, tomorrow, or a weekday name. Use
# `clear due <id>` to remove a due date.
cmd_due() {
	_u='usage: headway due <id> <date>'
	[ "$#" -ge 2 ] || usage_die "$_u"
	require_todo_file
	id=$(resolve_id "$1") || exit 1
	new_due=$(validate_due_date "$2") || exit 1
	parse_line "$(line_at "$id")"
	P_DUE="$new_due"
	new_line=$(format_line)
	replace_line_at "$id" "$new_line"
	report_change "due" "$id" "$new_line"
}

# (cmd_move was removed - its set-a-task's-project role is now the
# id-shaped form of cmd_project below.)

# cmd_priority <id> <A-Z>
# Targets the (A) slot for active tasks, or the pri: extension for
# already-completed ones, since a done line has no (A) position.
# Use `clear priority <id>` to remove a priority.
cmd_priority() {
	_u='usage: headway priority <id> <A-Z>'
	[ "$#" -ge 2 ] || usage_die "$_u"
	require_todo_file
	id=$(resolve_id "$1") || exit 1
	val="$2"
	case "$val" in
	[A-Z]) ;;
	*) die "invalid priority: $val (must be A-Z)" ;;
	esac
	parse_line "$(line_at "$id")"
	if [ "$P_DONE" = "true" ]; then
		P_PRI_EXT="$val"
	else
		P_PRIORITY="$val"
	fi
	new_line=$(format_line)
	replace_line_at "$id" "$new_line"
	report_change "priority" "$id" "$new_line"
}

# cmd_tag <id> @tag [@tag...]
# Adds one or more tags. Idempotent per tag - if the task already has
# one of the listed tags, it's a silent no-op for that tag. Use
# `clear tags <id>` to wipe all tags, or `clear tags <id> @tag` to
# remove specific tag(s).
cmd_tag() {
	_u='usage: headway tag <id> @tag [@tag...]'
	[ "$#" -ge 2 ] || usage_die "$_u"
	require_todo_file
	id=$(resolve_id "$1") || exit 1
	shift
	parse_line "$(line_at "$id")"

	_ct_added=0
	for _ct_tagval in "$@"; do
		case "$_ct_tagval" in
		@?*) ;;
		*) die "invalid tag: $_ct_tagval (want @tag)" ;;
		esac
		case " $P_TAGS " in
		*" $_ct_tagval "*)
			printf 'task %s already has tag %s\n' "$id" "$_ct_tagval"
			continue
			;;
		esac
		P_TAGS="${P_TAGS:+$P_TAGS }$_ct_tagval"
		_ct_added=$((_ct_added + 1))
	done

	[ "$_ct_added" -gt 0 ] || return 0

	new_line=$(format_line)
	replace_line_at "$id" "$new_line"
	report_change "tagged" "$id" "$new_line"
}

# cmd_clear <due|priority|tags|project> <id> [<id>...]
# cmd_clear tags <id> @tag [@tag...]
#
# Empties a field on one or more tasks. Any trailing @-prefixed arg
# is treated as a specific tag to remove and requires field=tags plus
# exactly one id; without them, `clear tags` wipes every tag on every
# listed task. Warns (without failing) when a removal targets a tag the
# task doesn't have.
cmd_clear() {
	_u='usage: headway clear <due|priority|tags|project> <id> [<id>...]
       headway clear tags <id> @tag [@tag...]'
	[ "$#" -ge 2 ] || usage_die "$_u"

	_cc_field="$1"
	shift
	case "$_cc_field" in
	due | priority | tags | project) ;;
	*) die "invalid field: $_cc_field (want due, priority, tags, or project)" ;;
	esac

	require_todo_file

	# Partition remaining args into ids and @-prefixed removal targets.
	_cc_ids=""
	_cc_tags=""
	for _cc_arg in "$@"; do
		case "$_cc_arg" in
		@?*) _cc_tags="${_cc_tags:+$_cc_tags }$_cc_arg" ;;
		*) _cc_ids="${_cc_ids:+$_cc_ids }$_cc_arg" ;;
		esac
	done

	[ -n "$_cc_ids" ] || usage_die "$_u"

	if [ -n "$_cc_tags" ]; then
		[ "$_cc_field" = "tags" ] || die "@tag arguments only valid with 'clear tags'"
		# Per-tag removal targets a single task; batching ids here would
		# be ambiguous ("did the user mean one @tag on many tasks, or a
		# task list with a stray @tag?"). Force the single-id shape.
		# shellcheck disable=SC2086
		set -- $_cc_ids
		[ "$#" -eq 1 ] || die "clear tags @tag takes a single id"
		_cc_id=$(resolve_id "$1") || exit 1
		parse_line "$(line_at "$_cc_id")"
		_cc_removed=0
		for _cc_target in $_cc_tags; do
			_cc_new=""
			_cc_found=false
			for _cc_t in $P_TAGS; do
				if [ "$_cc_t" = "$_cc_target" ]; then
					_cc_found=true
				else
					_cc_new="${_cc_new:+$_cc_new }$_cc_t"
				fi
			done
			if [ "$_cc_found" = "false" ]; then
				printf 'task %s has no tag %s\n' "$_cc_id" "$_cc_target"
				continue
			fi
			P_TAGS="$_cc_new"
			_cc_removed=$((_cc_removed + 1))
		done
		[ "$_cc_removed" -gt 0 ] || return 0
		new_line=$(format_line)
		replace_line_at "$_cc_id" "$new_line"
		report_change "cleared tag" "$_cc_id" "$new_line"
		return 0
	fi

	for _cc_arg in $_cc_ids; do
		_cc_id=$(resolve_id "$_cc_arg") || exit 1
		parse_line "$(line_at "$_cc_id")"
		case "$_cc_field" in
		due) P_DUE="" ;;
		priority)
			if [ "$P_DONE" = "true" ]; then P_PRI_EXT=""; else P_PRIORITY=""; fi
			;;
		tags) P_TAGS="" ;;
		project) P_PROJECTS="" ;;
		esac
		new_line=$(format_line)
		replace_line_at "$_cc_id" "$new_line"
		report_change "cleared $_cc_field" "$_cc_id" "$new_line"
	done
}

# cmd_delete <id> [<id>...]
# Deletes one or more tasks permanently. Prompts for confirmation unless
# CONFIRM_DELETE=false in the config; declining or piping EOF to the
# prompt cancels (the safe default), never deletes.
#
# All ids are resolved and their raw lines snapshotted before any deletion
# so a bad id aborts cleanly, and so a shown confirmation prompt names the
# real target even if a preceding delete has already shifted line numbers.
# Deletions happen in descending id order for the same reason - removing a
# higher line number doesn't invalidate a lower one.
cmd_delete() {
	_u='usage: headway delete <id> [<id>...]'
	[ "$#" -ge 1 ] || usage_die "$_u"
	require_todo_file

	# Pre-resolve + snapshot every (id, raw) pair to a tempfile, then
	# sort descending so later deletions don't renumber earlier ones.
	# Tempfile rather than a shell var because command substitution
	# eats trailing newlines, which would collapse tab-and-newline-
	# separated rows into one glued blob.
	_cd_pairs=$(mktemp) || die "mktemp failed"
	_cd_tab=$(printf '\t')
	for _cd_arg in "$@"; do
		_cd_id=$(resolve_id "$_cd_arg") || { rm -f "$_cd_pairs"; exit 1; }
		_cd_raw=$(line_at "$_cd_id")
		printf '%s\t%s\n' "$_cd_id" "$_cd_raw" >>"$_cd_pairs"
	done
	_cd_sorted=$(mktemp) || { rm -f "$_cd_pairs"; die "mktemp failed"; }
	sort -t "$_cd_tab" -k1,1 -n -r "$_cd_pairs" >"$_cd_sorted"
	rm -f "$_cd_pairs"

	# Confirm the whole batch at once (single prompt is easier to reason
	# about than N prompts). CONFIRM_DELETE=false skips this.
	if [ "$CONFIRM_DELETE" = "true" ]; then
		_cd_count=$(awk 'END { print NR }' "$_cd_sorted")
		if [ "$_cd_count" -eq 1 ]; then
			_cd_pid=$(head -n 1 "$_cd_sorted" | cut -f 1)
			_cd_pl=$(head -n 1 "$_cd_sorted" | cut -f 2-)
			use_color_err && _cd_pl=$(colorize_line "$_cd_pl")
			printf 'delete task %s: %s\nAre you sure? [y/N] ' "$_cd_pid" "$_cd_pl" >&2
		else
			printf 'delete %s tasks:\n' "$_cd_count" >&2
			while IFS="$_cd_tab" read -r _cd_pid _cd_pl; do
				[ -n "$_cd_pid" ] || continue
				use_color_err && _cd_pl=$(colorize_line "$_cd_pl")
				printf '  %s: %s\n' "$_cd_pid" "$_cd_pl" >&2
			done <"$_cd_sorted"
			printf 'Are you sure? [y/N] ' >&2
		fi
		reply=""
		read -r reply || reply=""
		case "$reply" in
		y | Y | yes | YES) ;;
		*)
			rm -f "$_cd_sorted"
			printf 'cancelled\n'
			return 0
			;;
		esac
	fi

	while IFS="$_cd_tab" read -r _cd_did _cd_dl; do
		[ -n "$_cd_did" ] || continue
		awk -v id="$_cd_did" 'NR != id' "$TODO_FILE" | safe_write "$TODO_FILE"
		report_change "deleted" "$_cd_did" "$_cd_dl"
	done <"$_cd_sorted"
	rm -f "$_cd_sorted"
}
# _cs_field <padded-label> <value> [value-theme]
# Prints one cmd_show detail line. Dims the label via THEME_DATE - the
# same "metadata" role it plays everywhere else. The value gets
# [value-theme] (e.g. THEME_PROJECT, THEME_DUE) so it matches how the
# same field is colored in listings; once the task is done, the value
# is dimmed via THEME_DONE instead, mirroring how colorize_line() dims a
# completed task as a whole. Reads $_cs_use_color/$_cs_status from
# cmd_show's scope.
_cs_field() {
	_csf_label="$1"
	_csf_value="$2"
	_csf_theme="${3:-}"
	if [ "$_cs_use_color" = "true" ]; then
		_csf_label=$(sgr_wrap "$THEME_DATE" "$_csf_label")
		if [ "$_cs_status" = "done" ]; then
			_csf_value=$(sgr_wrap "$THEME_DONE" "$_csf_value")
		elif [ -n "$_csf_theme" ]; then
			_csf_value=$(sgr_wrap "$_csf_theme" "$_csf_value")
		fi
	fi
	printf '%s%s\n' "$_csf_label" "$_csf_value"
}

# cmd_show <id>
# Prints a labelled detail block for a single task - the inverse of the
# one-liner render_view uses. Handy when the task line is long enough to
# wrap in a normal listing, or when you want the field names spelled out
# rather than encoded as +Project / @tag / due: / repeat:.
cmd_show() {
	_u='usage: headway show <id>'
	[ "$#" -ge 1 ] || usage_die "$_u"
	require_todo_file
	id=$(resolve_id "$1") || exit 1
	parse_line "$(line_at "$id")"

	_cs_status="open"
	[ "$P_DONE" = "true" ] && _cs_status="done"
	_cs_pri="${P_PRIORITY:-${P_PRI_EXT:-}}"
	_cs_use_color=false
	use_color && _cs_use_color=true

	_cs_field "id:         " "$id"
	_cs_field "status:     " "$_cs_status"
	[ -n "$_cs_pri" ] && _cs_field "priority:   " "$_cs_pri" "${THEME_PRIORITY:-}"
	[ -n "$P_DESC" ] && _cs_field "desc:       " "$P_DESC" "${THEME_DESC:-}"
	[ -n "$P_PROJECTS" ] && _cs_field "project:    " "$P_PROJECTS" "${THEME_PROJECT:-}"
	[ -n "$P_TAGS" ] && _cs_field "tags:       " "$P_TAGS" "${THEME_TAG:-}"
	[ -n "$P_DUE" ] && _cs_field "due:        " "$P_DUE" "${THEME_DUE:-}"
	[ -n "$P_REPEAT" ] && _cs_field "repeat:     " "$P_REPEAT" "${THEME_REPEAT:-}"
	[ -n "$P_CREATION_DATE" ] && _cs_field "created:    " "$P_CREATION_DATE" "${THEME_DATE:-}"
	[ -n "$P_COMPLETION_DATE" ] && _cs_field "completed:  " "$P_COMPLETION_DATE" "${THEME_DATE:-}"
	# The final [ -n "" ] && _cs_field ... returns 1 when the field is
	# empty; an explicit return keeps cmd_show's exit code aligned with
	# success.
	return 0
}

# cmd_list [+Project|@tag|"keyword"]
# With no filter, prints tasks grouped into Overdue / Due today / Upcoming
# / Someday (headers appear only if two or more of those buckets have
# entries). With a filter, prints a flat list - a targeted query wants
# its results contiguous, not carved into sections.
cmd_list() {
	if [ "$#" -ge 1 ] && [ -n "$1" ]; then
		render_view "list" "$1"
	else
		render_grouped_list
	fi
}

# cmd_view <view-name> [filter]
# Shared implementation for simple view commands whose command name,
# render_view name, and optional filter handling all match.
cmd_view() {
	_cv_name="$1"
	shift
	render_view "$_cv_name" "${1:-}"
}

cmd_inbox() {
	cmd_view "inbox" "$@"
}

cmd_today() {
	cmd_view "today" "$@"
}

cmd_upcoming() {
	cmd_view "upcoming" "$@"
}

cmd_someday() {
	cmd_view "someday" "$@"
}

cmd_logbook() {
	cmd_view "logbook" "$@"
}
# _list_projects
# Plain, uncolored list of distinct +Project tokens carried by incomplete
# tasks, one per line, sorted alphabetically. The shared data source
# behind cmd_projects (the user-facing command) as well as internal
# consumers that need plain tokens - cmd_stats and _rli_tab's completion
# candidates (src/07-editor.sh) - which would break if fed escape codes.
_list_projects() {
	[ -f "$TODO_FILE" ] || return 0
	awk '
	{
		if (substr($0, 1, 2) == "x ") next
		n = split($0, toks, " ")
		for (i = 1; i <= n; i++) {
			t = toks[i]
			if (substr(t, 1, 1) == "+" && length(t) > 1) print t
		}
	}' "$TODO_FILE" | sort -u
}

# cmd_projects
# Lists the distinct +Project tokens carried by incomplete tasks, one per
# line, sorted alphabetically - colorized via THEME_PROJECT like +Project
# tokens are everywhere else they appear, when use_color() allows it.
cmd_projects() {
	_cp_use_color=false
	use_color && _cp_use_color=true
	_list_projects | while IFS= read -r _cp_proj; do
		if [ "$_cp_use_color" = "true" ]; then
			sgr_wrap "$THEME_PROJECT" "$_cp_proj"
			printf '\n'
		else
			printf '%s\n' "$_cp_proj"
		fi
	done
}

# cmd_project +Project        (view: list tasks in a project)
# cmd_project <id> +Project   (set: assign a task to a project)
#
# Dispatches on the shape of the first argument: `+X` means view, a
# numeric id means set. Use `clear project <id>` to remove a task's
# project.
cmd_project() {
	_u='usage: headway project +Project              (list tasks in project)
       headway project <id> +Project      (assign task to project)'
	[ "$#" -ge 1 ] || usage_die "$_u"

	case "$1" in
	+?*)
		[ "$#" -eq 1 ] || usage_die "$_u"
		render_view "list" "$1"
		return 0
		;;
	esac

	# id-shaped form: <id> <+Project>
	[ "$#" -ge 2 ] || usage_die "$_u"
	require_todo_file
	id=$(resolve_id "$1") || exit 1
	value="$2"
	case "$value" in
	+?*) new_projects="$value" ;;
	*) die "invalid project value: $value (want +Project)" ;;
	esac
	parse_line "$(line_at "$id")"
	P_PROJECTS="$new_projects"
	new_line=$(format_line)
	replace_line_at "$id" "$new_line"
	report_change "project" "$id" "$new_line"
}
# cmd_archive
# Moves every completed ("x ...") line out of TODO_FILE and appends it to
# DONE_FILE, preserving DONE_FILE's existing content. Both files are
# rewritten atomically via safe_write.
cmd_archive() {
	[ -f "$TODO_FILE" ] || return 0
	archived=$(awk '/^x /' "$TODO_FILE")
	if [ -z "$archived" ]; then
		printf 'no completed tasks to archive\n'
		return 0
	fi

	remaining=$(awk '!/^x /' "$TODO_FILE")

	{
		[ -f "$DONE_FILE" ] && cat "$DONE_FILE"
		printf '%s\n' "$archived"
	} | safe_write "$DONE_FILE"

	if [ -n "$remaining" ]; then
		printf '%s\n' "$remaining" | safe_write "$TODO_FILE"
	else
		printf '' | safe_write "$TODO_FILE"
	fi

	count=$(printf '%s\n' "$archived" | awk 'END { print NR }')
	printf 'archived %s completed task(s)\n' "$count"
}

# _stat_field <label> <value>
# Prints one cmd_stats summary line, dimming the label via THEME_DATE -
# the same "metadata" role it plays everywhere else - when use_color()
# allows it. Reads $_st_use_color from cmd_stats's scope.
_stat_field() {
	if [ "$_st_use_color" = "true" ]; then
		printf '%s%s\n' "$(sgr_wrap "$THEME_DATE" "$1")" "$2"
	else
		printf '%s%s\n' "$1" "$2"
	fi
}

# cmd_stats
# Summary counts: active vs. done totals, a count per view, and a count
# per project (across incomplete tasks).
cmd_stats() {
	_st_use_color=false
	use_color && _st_use_color=true

	if [ ! -f "$TODO_FILE" ]; then
		_stat_field "tasks:    " "0 active, 0 done (0 total)"
		return 0
	fi

	counts=$(awk '
	{
		total++
		if (substr($0, 1, 2) == "x ") doneN++; else activeN++
	}
	END { printf "%d %d %d\n", total + 0, activeN + 0, doneN + 0 }
	' "$TODO_FILE")
	read -r total active done_count <<EOF
$counts
EOF

	_stat_field "tasks:    " "$active active, $done_count done ($total total)"
	_stat_field "inbox:    " "$(render_view inbox | awk 'END { print NR }')"
	_stat_field "today:    " "$(render_view today | awk 'END { print NR }')"
	_stat_field "upcoming: " "$(render_view upcoming | awk 'END { print NR }')"
	_stat_field "someday:  " "$(render_view someday | awk 'END { print NR }')"

	projects=$(_list_projects)
	if [ -n "$projects" ]; then
		_stat_field "projects:" ""
		# Pad the name column to the longest project name (+ a 2-space
		# gap) rather than a fixed width, so alignment holds regardless
		# of how long a project name is. Padding is computed and applied
		# to the plain name *before* colorizing - padding the colorized
		# string would count its invisible escape bytes toward the
		# width and silently break the alignment this is meant to fix.
		_st_width=$(printf '%s\n' "$projects" | awk '{ if (length($0) > w) w = length($0) } END { print w + 2 }')
		printf '%s\n' "$projects" | while IFS= read -r proj; do
			proj_count=$(render_view list "$proj" | awk 'END { print NR }')
			_st_gap=$((_st_width - ${#proj}))
			[ "$_st_gap" -lt 1 ] && _st_gap=1
			_st_spaces=$(printf "%${_st_gap}s" "")
			_st_display="$proj"
			[ "$_st_use_color" = "true" ] && _st_display=$(sgr_wrap "$THEME_PROJECT" "$proj")
			printf '  %s%s%s\n' "$_st_display" "$_st_spaces" "$proj_count"
		done
	fi
}

# cmd_check
# _check_report <line-no> <message>
# Emits one cmd_check diagnostic to stderr as "headway: line <N>: <message>"
# - the same "headway: " prefix every other error uses - dimming just the
# "line N" locator (reusing THEME_DATE, the same treatment metadata gets
# elsewhere) when use_color_err() allows it. Bumps the caller's $problems.
_check_report() {
	problems=$((problems + 1))
	_cr_loc="line $1"
	use_color_err && _cr_loc=$(sgr_wrap "$THEME_DATE" "$_cr_loc")
	printf 'headway: %s: %s\n' "$_cr_loc" "$2" >&2
}

# Verifies TODO_FILE is well-formed. Prints one diagnostic per problem
# found via _check_report, followed by a summary line; exits 0 if clean,
# 1 otherwise. Checks: blank lines, malformed priority markers, invalid
# due: dates, repeat: values outside daily/weekly/monthly/yearly, and
# completed lines missing either date.
cmd_check() {
	[ -f "$TODO_FILE" ] || die "no such file: $TODO_FILE"
	problems=0
	id=0
	while IFS= read -r raw || [ -n "$raw" ]; do
		id=$((id + 1))

		if [ -z "$raw" ]; then
			_check_report "$id" "blank line"
			continue
		fi

		case "$raw" in
		'x '*) is_done=true ;;
		*) is_done=false ;;
		esac

		if [ "$is_done" = "false" ]; then
			case "$raw" in
			'('*)
				case "$raw" in
				'('[A-Z]') '*) ;;
				*) _check_report "$id" "malformed priority marker" ;;
				esac
				;;
			esac
		else
			case "$raw" in
			'x '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]' '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]' '*) ;;
			'x '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]' '*)
				_check_report "$id" "completed task missing creation date"
				;;
			*)
				_check_report "$id" "completed task missing completion date"
				;;
			esac
		fi

		set -f
		for tok in $raw; do
			case "$tok" in
			due:*)
				dueval="${tok#due:}"
				if ! is_valid_date "$dueval"; then
					_check_report "$id" "invalid due date: $dueval"
				fi
				;;
			repeat:*)
				repeatval="${tok#repeat:}"
				case "$repeatval" in
				daily | weekly | monthly | yearly) ;;
				*) _check_report "$id" "invalid repeat value: $repeatval" ;;
				esac
				;;
			esac
		done
		set +f
	done <"$TODO_FILE"

	if [ "$problems" -eq 0 ]; then
		printf 'TODO_FILE is well-formed\n'
		return 0
	fi

	_cc_word="problems"
	[ "$problems" -eq 1 ] && _cc_word="problem"
	printf 'headway: %s %s found\n' "$problems" "$_cc_word" >&2
	return 1
}
tokenize_line() {
	_tl_rest="$1"
	_tl_tab=$(printf '\t')
	_tl_tokens=""
	_tl_cur=""
	_tl_in_tok=false
	_tl_quote=""

	while [ -n "$_tl_rest" ]; do
		_tl_c="${_tl_rest%"${_tl_rest#?}"}"
		_tl_rest="${_tl_rest#?}"

		if [ -n "$_tl_quote" ]; then
			if [ "$_tl_c" = "$_tl_quote" ]; then
				_tl_quote=""
			else
				_tl_cur="$_tl_cur$_tl_c"
			fi
			continue
		fi

		case "$_tl_c" in
		"'" | '"')
			_tl_quote="$_tl_c"
			_tl_in_tok=true
			;;
		" " | "$_tl_tab")
			if [ "$_tl_in_tok" = "true" ]; then
				_tl_tokens="${_tl_tokens:+$_tl_tokens$US}$_tl_cur"
				_tl_cur=""
				_tl_in_tok=false
			fi
			;;
		*)
			_tl_cur="$_tl_cur$_tl_c"
			_tl_in_tok=true
			;;
		esac
	done

	[ -z "$_tl_quote" ] || return 1

	if [ "$_tl_in_tok" = "true" ]; then
		_tl_tokens="${_tl_tokens:+$_tl_tokens$US}$_tl_cur"
	fi

	printf '%s' "$_tl_tokens"
}

# ---------------------------------------------------------------------------
# Interactive line editing (read_line_interactive and helpers)
#
# A real line editor for the shell prompt - arrow-key cursor movement,
# Home/End, Backspace/Delete, and file-backed Up/Down/PgUp/PgDn history -
# built entirely in POSIX sh. `dd bs=1 count=1` reads one raw byte at a
# time, `stty -icanon -echo` puts the terminal in raw mode for the
# duration of a single line read, plain ANSI escapes handle redraw/cursor
# positioning, and buffer edits reuse the same peel-one-character
# parameter-expansion idiom tokenize_line uses above (POSIX sh has no
# arrays and no substring-by-offset expansion, so every edit is expressed
# as moving one character between two strings - $_rli_before, the text
# left of the cursor, and $_rli_after, the text right of it). History is
# file-backed rather than an in-memory array for the same reason.
#
# Only ever used when [ -t 0 ]; cmd_shell falls back to plain `read -r`
# otherwise, unchanged.
# ---------------------------------------------------------------------------

# _rli_history_path
# Resolves the history file path: $HEADWAY_HISTORY if set, otherwise a
# sibling of the config file (same directory as HEADWAY_CONFIG's default,
# ~/.config/headway/config -> ~/.config/headway/history). Prints the path.
_rli_history_path() {
	if [ -n "${HEADWAY_HISTORY:-}" ]; then
		expand_tilde "$HEADWAY_HISTORY"
	else
		_rli_hp_conf=$(expand_tilde "${HEADWAY_CONFIG:-$HOME/.config/headway/config}")
		printf '%s/history\n' "${_rli_hp_conf%/*}"
	fi
}

# _rli_history_count
# Prints the number of entries currently in the history file (0 if it
# doesn't exist yet).
_rli_history_count() {
	_rli_hf=$(_rli_history_path)
	if [ -f "$_rli_hf" ]; then
		wc -l <"$_rli_hf" 2>/dev/null | tr -d ' ' || printf '0'
	else
		printf '0'
	fi
}

# _rli_history_at <n>
# Prints the 1-based nth history entry, or nothing if out of range.
_rli_history_at() {
	_rli_hf=$(_rli_history_path)
	[ -f "$_rli_hf" ] || return 0
	sed -n "${1}p" "$_rli_hf" 2>/dev/null || true
}

# _rli_history_append <line>
# Appends <line> to the history file (creating its directory if needed),
# skipping an exact repeat of the immediately preceding entry. Fails soft
# on any error - history is a convenience, never worth aborting the
# session over.
_rli_history_append() {
	_rli_line="$1"
	_rli_hf=$(_rli_history_path)
	_rli_hf_dir="${_rli_hf%/*}"
	[ -d "$_rli_hf_dir" ] || mkdir -p "$_rli_hf_dir" 2>/dev/null || return 0
	if [ -f "$_rli_hf" ]; then
		_rli_last=$(tail -n 1 "$_rli_hf" 2>/dev/null || true)
		[ "$_rli_last" = "$_rli_line" ] && return 0
	fi
	printf '%s\n' "$_rli_line" >>"$_rli_hf" 2>/dev/null || true
}

# _rli_history_prev / _rli_history_next
# Move one step back/forward through history, replacing the current
# buffer with the recalled entry. The first step back from the
# not-yet-submitted line stashes it in $_rli_hist_saved so stepping
# forward past the most recent entry restores it verbatim, matching
# readline's usual behaviour.
_rli_history_prev() {
	[ "$_rli_hist_pos" -gt 1 ] || return 0
	if [ "$_rli_hist_pos" -eq "$((_rli_hist_count + 1))" ]; then
		_rli_hist_saved="$_rli_before$_rli_after"
	fi
	_rli_hist_pos=$((_rli_hist_pos - 1))
	_rli_before=$(_rli_history_at "$_rli_hist_pos")
	_rli_after=""
}

_rli_history_next() {
	[ "$_rli_hist_pos" -lt "$((_rli_hist_count + 1))" ] || return 0
	_rli_hist_pos=$((_rli_hist_pos + 1))
	if [ "$_rli_hist_pos" -eq "$((_rli_hist_count + 1))" ]; then
		_rli_before="$_rli_hist_saved"
	else
		_rli_before=$(_rli_history_at "$_rli_hist_pos")
	fi
	_rli_after=""
}

# _rli_history_prev_n <n> / _rli_history_next_n <n>
# Coarse history jumps (Page Up/Down): n single steps in a row.
_rli_history_prev_n() {
	_rli_n="$1"
	while [ "$_rli_n" -gt 0 ]; do
		_rli_history_prev
		_rli_n=$((_rli_n - 1))
	done
}

_rli_history_next_n() {
	_rli_n="$1"
	while [ "$_rli_n" -gt 0 ]; do
		_rli_history_next
		_rli_n=$((_rli_n - 1))
	done
}

# _rli_read_byte
# Reads exactly one raw byte from stdin into $_rli_byte. Returns 1 on
# true stream EOF (no byte read at all). A trailing sentinel defeats
# command substitution's unconditional stripping of trailing newlines,
# which would otherwise make a newline keystroke indistinguishable from
# EOF (both would read back as an empty string).
_rli_read_byte() {
	_rli_raw=$(dd bs=1 count=1 2>/dev/null; printf 'X')
	if [ "$_rli_raw" = "X" ]; then
		_rli_byte=""
		return 1
	fi
	_rli_byte="${_rli_raw%X}"
}

# _hw_tags_in_todo
# Distinct @tag tokens present in TODO_FILE, sorted, one per line. Used
# by _rli_tab for @-completion. Empty output if the file doesn't exist or
# has no @tags.
_hw_tags_in_todo() {
	[ -f "$TODO_FILE" ] || return 0
	awk '
	{
		if (substr($0, 1, 2) == "x ") next
		n = split($0, toks, " ")
		for (i = 1; i <= n; i++) {
			t = toks[i]
			if (substr(t, 1, 1) == "@" && length(t) > 1) print t
		}
	}' "$TODO_FILE" | sort -u
}

# _rli_tab
# Complete the partial token at end of $_rli_before against commands
# (first token), projects (starts with +), or tags (starts with @). One
# match: fill the buffer and add a trailing space. Multiple matches:
# print them below the current prompt line; the main loop's _rli_redraw
# then reprints the prompt and buffer on a fresh line. Zero matches:
# silent no-op.
#
# Deliberately does nothing when the cursor is mid-line ($_rli_after
# non-empty) - completing between existing characters is ergonomically
# fiddly and not worth the complexity in v1.
_rli_tab() {
	[ -z "$_rli_after" ] || return 0

	# Extract the trailing partial (non-space chars at end of _rli_before)
	# and $_rli_tab_pre (everything before it, whitespace intact).
	_rli_tab_partial=""
	_rli_tab_pre="$_rli_before"
	while [ -n "$_rli_tab_pre" ]; do
		_rli_tab_lc="${_rli_tab_pre#"${_rli_tab_pre%?}"}"
		[ "$_rli_tab_lc" = " " ] && break
		_rli_tab_partial="$_rli_tab_lc$_rli_tab_partial"
		_rli_tab_pre="${_rli_tab_pre%?}"
	done

	# No partial (empty buffer or trailing space): would flood with every
	# candidate; require the user to type at least one character first.
	[ -n "$_rli_tab_partial" ] || return 0

	# "First token" iff $_rli_tab_pre contains no non-space char.
	_rli_tab_hasprefix=false
	_rli_tab_p="$_rli_tab_pre"
	while [ -n "$_rli_tab_p" ]; do
		_rli_tab_pc="${_rli_tab_p#"${_rli_tab_p%?}"}"
		if [ "$_rli_tab_pc" != " " ]; then
			_rli_tab_hasprefix=true
			break
		fi
		_rli_tab_p="${_rli_tab_p%?}"
	done

	case "$_rli_tab_partial" in
	+*) _rli_tab_src="projects" ;;
	@*) _rli_tab_src="tags" ;;
	*)
		[ "$_rli_tab_hasprefix" = "false" ] || return 0
		_rli_tab_src="commands"
		;;
	esac

	case "$_rli_tab_src" in
	projects) _rli_tab_cands=$(_list_projects 2>/dev/null || true) ;;
	tags) _rli_tab_cands=$(_hw_tags_in_todo) ;;
	commands) _rli_tab_cands=$(headway_commands | tr ' ' '\n') ;;
	esac
	[ -n "$_rli_tab_cands" ] || return 0

	_rli_tab_matches=""
	_rli_tab_mcount=0
	_rli_tab_first=""
	_rli_tab_ifs="$IFS"
	IFS='
'
	for _rli_tab_c in $_rli_tab_cands; do
		[ -n "$_rli_tab_c" ] || continue
		case "$_rli_tab_c" in
		"$_rli_tab_partial"*)
			_rli_tab_mcount=$((_rli_tab_mcount + 1))
			[ -z "$_rli_tab_first" ] && _rli_tab_first="$_rli_tab_c"
			_rli_tab_matches="${_rli_tab_matches}${_rli_tab_c}
"
			;;
		esac
	done
	IFS="$_rli_tab_ifs"

	if [ "$_rli_tab_mcount" -eq 0 ]; then
		return 0
	elif [ "$_rli_tab_mcount" -eq 1 ]; then
		_rli_before="${_rli_tab_pre}${_rli_tab_first} "
	else
		printf '\n' >&2
		printf '%s' "$_rli_tab_matches" | while IFS= read -r _rli_tab_m; do
			[ -n "$_rli_tab_m" ] && printf '  %s\n' "$_rli_tab_m" >&2
		done
	fi
}

_rli_backspace() {
	[ -n "$_rli_before" ] || return 0
	_rli_before="${_rli_before%?}"
}

_rli_forward_delete() {
	[ -n "$_rli_after" ] || return 0
	_rli_after="${_rli_after#?}"
}

_rli_cursor_left() {
	[ -n "$_rli_before" ] || return 0
	_rli_c="${_rli_before#"${_rli_before%?}"}"
	_rli_before="${_rli_before%?}"
	_rli_after="$_rli_c$_rli_after"
}

_rli_cursor_right() {
	[ -n "$_rli_after" ] || return 0
	_rli_c="${_rli_after%"${_rli_after#?}"}"
	_rli_after="${_rli_after#?}"
	_rli_before="$_rli_before$_rli_c"
}

_rli_cursor_home() {
	_rli_after="$_rli_before$_rli_after"
	_rli_before=""
}

_rli_cursor_end() {
	_rli_before="$_rli_before$_rli_after"
	_rli_after=""
}

_rli_redraw() {
	printf '\r\033[K' >&2
	printf 'headway $ %s%s' "$_rli_before" "$_rli_after" >&2
	if [ -n "$_rli_after" ]; then
		printf '\033[%dD' "${#_rli_after}" >&2
	fi
}

_rli_handle_esc() {
	_rli_read_byte || return 1
	[ "$_rli_interrupted" = "true" ] && return 0
	[ "$_rli_byte" = "[" ] || return 0

	_rli_read_byte || return 1
	[ "$_rli_interrupted" = "true" ] && return 0
	_rli_seq="$_rli_byte"

	case "$_rli_seq" in
	A) _rli_history_prev ;;
	B) _rli_history_next ;;
	C) _rli_cursor_right ;;
	D) _rli_cursor_left ;;
	H) _rli_cursor_home ;;
	F) _rli_cursor_end ;;
	1 | 3 | 4 | 5 | 6)
		_rli_read_byte || return 1
		[ "$_rli_interrupted" = "true" ] && return 0
		if [ "$_rli_byte" = "~" ]; then
			case "$_rli_seq" in
			1) _rli_cursor_home ;;
			4) _rli_cursor_end ;;
			3) _rli_forward_delete ;;
			5) _rli_history_prev_n 10 ;;
			6) _rli_history_next_n 10 ;;
			esac
		fi
		;;
	*) : ;;
	esac
}

_rli_cleanup() {
	stty "$_rli_saved_stty" 2>/dev/null
	trap - INT
}

# read_line_interactive
# One interactively-edited line: arrow keys, Home/End, Backspace/Delete,
# and Up/Down/PgUp/PgDn history all work. Prints the finished line to
# stdout with no trailing newline. Returns 0 on Enter, 1 on EOF/Ctrl-D on
# an empty line, or 130 on Ctrl-C.
read_line_interactive() {
	_rli_before=""
	_rli_after=""
	_rli_interrupted=false
	_rli_saved_stty=$(stty -g 2>/dev/null) || return 1
	stty -icanon -echo min 1 time 0 2>/dev/null

	_rli_hist_count=$(_rli_history_count)
	_rli_hist_pos=$((_rli_hist_count + 1))
	_rli_hist_saved=""

	# Command substitution strips trailing newlines; append and strip a
	# sentinel so Enter can be compared as a real byte, not as empty text.
	_rli_nl=$(printf '\nX')
	_rli_nl="${_rli_nl%X}"
	_rli_del=$(printf '\177')
	_rli_bs=$(printf '\010')
	_rli_esc=$(printf '\033')
	_rli_ctrld=$(printf '\004')
	_rli_tab_byte=$(printf '\t')

	trap '_rli_interrupted=true' INT

	while :; do
		if ! _rli_read_byte; then
			_rli_cleanup
			return 1
		fi
		if [ "$_rli_interrupted" = "true" ]; then
			_rli_cleanup
			printf '^C\n' >&2
			return 130
		fi

		case "$_rli_byte" in
		"$_rli_nl")
			break
			;;
		"$_rli_esc")
			if ! _rli_handle_esc; then
				_rli_cleanup
				return 1
			fi
			if [ "$_rli_interrupted" = "true" ]; then
				_rli_cleanup
				printf '^C\n' >&2
				return 130
			fi
			;;
		"$_rli_del" | "$_rli_bs")
			_rli_backspace
			;;
		"$_rli_tab_byte")
			_rli_tab
			;;
		"$_rli_ctrld")
			if [ -z "$_rli_before$_rli_after" ]; then
				_rli_cleanup
				return 1
			fi
			;;
		*)
			_rli_before="$_rli_before$_rli_byte"
			;;
		esac

		_rli_redraw
	done

	_rli_cleanup
	printf '\n' >&2
	printf '%s' "$_rli_before$_rli_after"
}
# ---------------------------------------------------------------------------
# Dispatch
# ---------------------------------------------------------------------------

# dispatch_cmd <command> [arguments...]
# The single source of truth for mapping a command name to its cmd_*
# function. Used by both one-shot command execution and cmd_shell's REPL.
dispatch_cmd() {
	cmd="${1:-}"
	[ "$#" -gt 0 ] && shift

	case "$cmd" in
	add) cmd_add "$@" ;;
	complete) cmd_complete "$@" ;;
	undo) cmd_undo "$@" ;;
	edit) cmd_edit "$@" ;;
	due) cmd_due "$@" ;;
	priority) cmd_priority "$@" ;;
	tag) cmd_tag "$@" ;;
	clear) cmd_clear "$@" ;;
	delete) cmd_delete "$@" ;;
	show) cmd_show "$@" ;;
	list) cmd_list "$@" ;;
	inbox) cmd_inbox "$@" ;;
	today) cmd_today "$@" ;;
	upcoming) cmd_upcoming "$@" ;;
	someday) cmd_someday "$@" ;;
	logbook) cmd_logbook "$@" ;;
	projects) cmd_projects "$@" ;;
	project) cmd_project "$@" ;;
	archive) cmd_archive "$@" ;;
	stats) cmd_stats "$@" ;;
	check) cmd_check "$@" ;;
	help) usage ;;
	exit) usage_die "exit is only available inside the interactive shell" ;;
	*)
		err "unknown command: $cmd"
		suggest_command "$cmd"
		err "type 'help' for the full command list"
		return 2
		;;
	esac
}

# shell_open_count
# Prints the number of open (not completed) tasks in TODO_FILE.
shell_open_count() {
	[ -f "$TODO_FILE" ] || return 0

	awk '{ if (substr($0, 1, 2) != "x ") n++ } END { print n + 0 }' "$TODO_FILE"
}

# shell_welcome_task_line <id> <raw-line> <use-color>
# Prints one indented task line in the same logical shape as render_view:
# "<id>: <date> <description> [+project] [due:date] [@tag]". The optional
# color treatment reuses existing THEME_* values and is display-only.
shell_welcome_task_line() {
	_swtl_id="$1"
	_swtl_raw="$2"
	_swtl_use_color="$3"

	if [ "$_swtl_use_color" = "true" ]; then
		_swtl_id=$(sgr_wrap "$THEME_DATE" "$_swtl_id")
		_swtl_line=$(colorize_line "$_swtl_raw")
	else
		_swtl_line="$_swtl_raw"
	fi

	if [ "${SHOW_IDS:-true}" = "false" ]; then
		printf '  %s\n' "$_swtl_line"
	else
		printf '  %s: %s\n' "$_swtl_id" "$_swtl_line"
	fi
}

# shell_welcome_group <rows> <today> <group> <use-color>
# Prints up to three overdue or due-today task lines from tab-delimited
# collect_view_rows output. Extra rows collapse into "... N more — see
# 'today'" to keep the startup banner short.
shell_welcome_group() {
	_swg_rows="$1"
	_swg_today="$2"
	_swg_group="$3"
	_swg_use_color="$4"
	_swg_tab=$(printf '\t')
	_swg_seen=0

	[ -n "$_swg_rows" ] || return 0

	printf '%s\n' "$_swg_rows" | while IFS="$_swg_tab" read -r _ _swg_id _swg_due _swg_raw; do
		case "$_swg_group" in
		overdue)
			expr "$_swg_due" '<' "$_swg_today" >/dev/null || continue
			;;
		today)
			[ "$_swg_due" = "$_swg_today" ] || continue
			;;
		esac

		_swg_seen=$((_swg_seen + 1))
		if [ "$_swg_seen" -le 3 ]; then
			shell_welcome_task_line "$_swg_id" "$_swg_raw" "$_swg_use_color"
		fi
	done
}

# shell_welcome_count <rows> <today> <group> [skip]
# Counts welcome rows for a group. With [skip], subtracts that many rows
# from the count, floored at zero; used for the "... N more" summary.
shell_welcome_count() {
	_swc_rows="$1"
	_swc_today="$2"
	_swc_group="$3"
	_swc_skip="${4:-0}"
	_swc_tab=$(printf '\t')

	[ -n "$_swc_rows" ] || {
		printf '0\n'
		return 0
	}

	printf '%s\n' "$_swc_rows" | while IFS="$_swc_tab" read -r _ _ _swc_due _; do
		case "$_swc_group" in
		overdue)
			expr "$_swc_due" '<' "$_swc_today" >/dev/null || continue
			;;
		today)
			[ "$_swc_due" = "$_swc_today" ] || continue
			;;
		esac
		printf '.\n'
	done | awk -v skip="$_swc_skip" 'END { n = NR - skip; if (n < 0) n = 0; print n }'
}

# shell_welcome_banner
# Prints the interactive shell welcome message before the first prompt.
shell_welcome_banner() {
	_swb_today=$(today)
	_swb_active=0
	[ -f "$TODO_FILE" ] && _swb_active=$(shell_open_count)
	_swb_rows=""
	if [ -f "$TODO_FILE" ]; then
		_swb_tab=$(printf '\t')
		_swb_rows=$(collect_view_rows today | sort -t "$_swb_tab" -k1,1)
	fi
	_swb_due_count=$(printf '%s\n' "$_swb_rows" | awk 'NF { n++ } END { print n + 0 }')
	_swb_overdue_count=$(shell_welcome_count "$_swb_rows" "$_swb_today" overdue 0)
	_swb_today_count=$(shell_welcome_count "$_swb_rows" "$_swb_today" today 0)
	_swb_use_color=false
	use_color_err && _swb_use_color=true

	_swb_version="headway v$HEADWAY_VERSION"
	_swb_hint='Type "help" for commands, "exit" to leave.'
	if [ "$_swb_use_color" = "true" ]; then
		_swb_version=$(sgr_wrap "$THEME_DATE" "$_swb_version")
		_swb_hint=$(sgr_wrap "$THEME_DATE" "$_swb_hint")
	fi

	printf '%s\n\n' "$_swb_version"

	if [ "$_swb_due_count" -gt 0 ]; then
		_swb_due_text=$_swb_due_count
		[ "$_swb_use_color" = "true" ] && _swb_due_text=$(sgr_wrap "$THEME_DUE" "$_swb_due_text")
		_swb_due_word="tasks"
		[ "$_swb_due_count" -eq 1 ] && _swb_due_word="task"
		printf '%s! You have %s %s due.\n' "$(greeting)" "$_swb_due_text" "$_swb_due_word"
	else
		_swb_task_word="tasks"
		[ "$_swb_active" -eq 1 ] && _swb_task_word="task"
		printf '%s! You have %s open %s, nothing due today.\n' "$(greeting)" "$_swb_active" "$_swb_task_word"
	fi

	if [ "$_swb_due_count" -gt 0 ]; then
		_swb_show_headers=false
		if [ "$_swb_overdue_count" -gt 0 ] && [ "$_swb_today_count" -gt 0 ]; then
			_swb_show_headers=true
		fi

		if [ "$_swb_overdue_count" -gt 0 ]; then
			printf '\n'
			if [ "$_swb_show_headers" = "true" ]; then
				_swb_header="Overdue"
				[ "$_swb_use_color" = "true" ] && _swb_header=$(sgr_wrap "$THEME_DATE" "$_swb_header")
				printf '  %s\n' "$_swb_header"
			fi
			shell_welcome_group "$_swb_rows" "$_swb_today" overdue "$_swb_use_color"
			_swb_more=$(shell_welcome_count "$_swb_rows" "$_swb_today" overdue 3)
			[ "$_swb_more" -gt 0 ] && printf "  … %s more — see 'today'\n" "$_swb_more"
		fi

		if [ "$_swb_today_count" -gt 0 ]; then
			printf '\n'
			if [ "$_swb_show_headers" = "true" ]; then
				_swb_header="Due today"
				[ "$_swb_use_color" = "true" ] && _swb_header=$(sgr_wrap "$THEME_DATE" "$_swb_header")
				printf '  %s\n' "$_swb_header"
			fi
			shell_welcome_group "$_swb_rows" "$_swb_today" today "$_swb_use_color"
			_swb_more=$(shell_welcome_count "$_swb_rows" "$_swb_today" today 3)
			[ "$_swb_more" -gt 0 ] && printf "  … %s more — see 'today'\n" "$_swb_more"
		fi
	fi

	printf '\n%s\n\n' "$_swb_hint"
}

# cmd_shell
# Starts an interactive session, tokenizes each line without evaluating it
# as shell code, and dispatches the resulting command. Interactive terminals
# get read_line_interactive; piped input falls back to plain read -r.
cmd_shell() {
	if [ -t 0 ]; then
		# SIGINT is delivered to the whole foreground process group; the
		# raw-mode reader handles it inside command substitution, so the
		# outer REPL ignores it and inspects the reader's status instead.
		trap '' INT
		shell_welcome_banner >&2
	fi

	while :; do
		if [ -t 0 ]; then
			printf 'headway $ ' >&2
			_sh_rc=0
			line=$(read_line_interactive) || _sh_rc=$?
			if [ "$_sh_rc" -ne 0 ]; then
				if [ "$_sh_rc" -eq 130 ]; then
					continue
				fi
				printf '\n' >&2
				break
			fi
		else
			if ! IFS= read -r line; then
				break
			fi
		fi

		case "$line" in
		'') continue ;;
		esac

		[ -t 0 ] && _rli_history_append "$line"

		# Tokenize the line so quoted multi-word text (e.g. add "buy
		# milk" +Errands) survives, without evaluating it as shell code -
		# see tokenize_line's comment for why that distinction matters.
		if ! _sh_tokens=$(tokenize_line "$line"); then
			err "unterminated quote: $line"
			continue
		fi

		_sh_old_ifs="$IFS"
		IFS="$US"
		set -f
		# shellcheck disable=SC2086
		set -- $_sh_tokens
		set +f
		IFS="$_sh_old_ifs"

		[ "$#" -eq 0 ] && continue

		case "$1" in
		exit) break ;;
		esac

		# Run each command in a subshell: a failing command calls die(),
		# which does `exit 1` - in a subshell that only ends the subshell,
		# not the whole interactive session. The subshell must be run as a
		# plain, untested statement (not the operand of `!`/`if`/`&&`): in
		# dash and bash, errexit is ignored for the *entire* execution of a
		# command in one of those tested positions, including everything
		# that runs inside a subshell there - so a failing command partway
		# through dispatch_cmd would silently be skipped over instead of
		# stopping it, even with an explicit `set -eu` inside the parens.
		# Toggling the outer `-e` off just for this one statement is what
		# lets the subshell's own `set -eu` behave normally internally
		# while still letting the REPL loop survive its overall failure.
		set +e
		(set -eu; dispatch_cmd "$@")
		set -e
	done
}
# ---------------------------------------------------------------------------
# Usage
# ---------------------------------------------------------------------------

usage() {
	cat <<EOF
headway $HEADWAY_VERSION - a shell-based todo.txt task manager.

Usage: headway              start the interactive shell
       headway <command>    run one command and exit
       headway --version    print the version and exit

Run \`headway\` with no arguments for the interactive shell, or pass any
command directly, e.g. \`headway add "Book flights"\`.

Task IDs are the task's current line number in TODO_FILE. They are NOT
stable across edits - deleting or archiving a task shifts the IDs of
every task below it.

Adding:
  add "text [+Project] [due:DATE] [@tag]"   add a task

Completing:
  complete <id> [<id>...]                   mark done (priority -> pri:A)
  undo <id> [<id>...]                       unmark (restores (A) priority)

Editing:
  edit <id>                                 open task in \$EDITOR
  edit <id> <text>                          replace task line directly
  due <id> <DATE>                           set or update due date
  priority <id> <A-Z>                       set or update priority
  tag <id> @tag [@tag...]                   add tag(s)
  project <id> +Project                     assign task to a project
  clear due <id> [<id>...]                  clear due date
  clear priority <id> [<id>...]             clear priority
  clear tags <id> [<id>...]                 clear all tags
  clear tags <id> @tag [@tag...]            remove specific tag(s)
  clear project <id> [<id>...]              clear project
  show <id>                                 print full detail for one task
  delete <id> [<id>...]                     delete permanently

Listing:
  list [+Project|@tag|"keyword"]            list incomplete tasks (grouped)
  inbox                                     tasks with no due date and no project
  today                                     due today, plus overdue
  upcoming                                  future-dated tasks
  someday                                   project tasks with no due date
  logbook                                   completed tasks

Projects:
  projects                                  list all projects
  project +Project                          show tasks in a project

Maintenance:
  archive                                   move completed tasks to DONE_FILE
  stats                                     summary counts
  check                                     verify TODO_FILE is well-formed

Shell:
  help                                      show this help
  exit                                      end the shell session (also Ctrl-D)
EOF
}

init_runtime() {
	load_config
	detect_date_flavor
}

main() {
	# No arguments launches the shell; arguments run a single command
	# through the same dispatcher the shell uses.
	if [ "$#" -eq 0 ]; then
		init_runtime
		cmd_shell
		return
	fi

	if [ "$#" -eq 1 ]; then
		case "$1" in
		help)
			usage
			return 0
			;;
		--version)
			printf 'headway %s\n' "$HEADWAY_VERSION"
			return 0
			;;
		esac
	fi

	init_runtime
	dispatch_cmd "$@"
}

# Allow this script to be sourced as a library (e.g. by tests that want to
# call parse_line/format_line directly) without executing main().
if [ "${HEADWAY_LIB_ONLY:-false}" != "true" ]; then
	main "$@"
fi
