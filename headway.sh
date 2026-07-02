#!/bin/sh
# headway - a minimal todo.txt CLI task manager.
#
# POSIX sh ONLY. Do not use bashisms: no arrays, no [[ ]], no local,
# no +=, no here-strings, no C-style for loops. This script must run
# unmodified under dash and BusyBox ash.

set -eu

HEADWAY_VERSION="0.1.0"

# ---------------------------------------------------------------------------
# Defaults
# ---------------------------------------------------------------------------

TODO_FILE_DEFAULT="$HOME/todo.txt"
DONE_FILE_DEFAULT="$HOME/done.txt"
EDITOR_DEFAULT="vi"
COLOR_DEFAULT="auto"
DATE_FORMAT_DEFAULT="%Y-%m-%d"
SHOW_IDS_DEFAULT="true"
AUTO_ARCHIVE_DEFAULT="false"
CONFIRM_DELETE_DEFAULT="true"

# Theme: bare SGR parameter codes (no \033[ / m wrapper) applied when
# COLOR is active. THEME_DESC is intentionally empty (unstyled).
THEME_PRIORITY_DEFAULT="1;33"
THEME_PROJECT_DEFAULT="36"
THEME_TAG_DEFAULT="35"
THEME_DUE_DEFAULT="1;31"
THEME_DATE_DEFAULT="2"
THEME_DESC_DEFAULT=""
THEME_REPEAT_DEFAULT="34"
THEME_DONE_DEFAULT="2"

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

# expand_tilde <value>
# Expands a single leading "~" or "~/..." to $HOME. Needed because a value
# arriving via an environment variable (rather than literally written in a
# sourced shell file) is never tilde-expanded by the shell automatically.
expand_tilde() {
	case "$1" in
	"~")
		printf '%s\n' "$HOME"
		;;
	"~/"*)
		printf '%s\n' "$HOME/${1#\~/}"
		;;
	*)
		printf '%s\n' "$1"
		;;
	esac
}

# use_color
# Returns success (0) if colored output should be used, based on the
# COLOR config value ("auto"/"true"/"false") and whether stdout is a tty.
use_color() {
	case "${COLOR:-auto}" in
	true) return 0 ;;
	false) return 1 ;;
	*) [ -t 1 ] ;;
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
	*) [ -t 2 ] ;;
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

# date_add_days <YYYY-MM-DD> <signed-offset>
date_add_days() {
	base="$1"
	offset="$2"
	case "$DATE_FLAVOR" in
	gnu) date -d "$base + $offset day" "+%Y-%m-%d" ;;
	bsd) date -j -v"${offset}"d -f "%Y-%m-%d" "$base" "+%Y-%m-%d" ;;
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
	bsd) date -j -v"${offset}"m -f "%Y-%m-%d" "$base" "+%Y-%m-%d" ;;
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
	bsd) date -j -v"${offset}"y -f "%Y-%m-%d" "$base" "+%Y-%m-%d" ;;
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

# resolve_date_shorthand <value>
# Maps "today", "+Nd" and a literal YYYY-MM-DD to a real YYYY-MM-DD date.
# Anything else is rejected (non-zero exit, nothing printed) so callers
# never write a relative keyword to disk.
resolve_date_shorthand() {
	input="$1"
	case "$input" in
	today)
		today
		;;
	tomorrow)
		date_add_days "$(today)" 1
		;;
	+[0-9]*d)
		n=$(expr "$input" : '+\([0-9]*\)d')
		date_add_days "$(today)" "$n"
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
	_lc_had_dfmt=${DATE_FORMAT+x}
	_lc_env_dfmt=${DATE_FORMAT-}
	_lc_had_ids=${SHOW_IDS+x}
	_lc_env_ids=${SHOW_IDS-}
	_lc_had_arch=${AUTO_ARCHIVE+x}
	_lc_env_arch=${AUTO_ARCHIVE-}
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
	if [ -n "$_lc_had_dfmt" ]; then DATE_FORMAT="$_lc_env_dfmt"; fi
	if [ -n "$_lc_had_ids" ]; then SHOW_IDS="$_lc_env_ids"; fi
	if [ -n "$_lc_had_arch" ]; then AUTO_ARCHIVE="$_lc_env_arch"; fi
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
	: "${DATE_FORMAT:=$DATE_FORMAT_DEFAULT}"
	: "${SHOW_IDS:=$SHOW_IDS_DEFAULT}"
	: "${AUTO_ARCHIVE:=$AUTO_ARCHIVE_DEFAULT}"
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

# task_matches_filter <filter> <raw-line>
# Must be called with P_PROJECTS/P_TAGS already populated by parse_line for
# the same line. +Project and @tag filters match a whole token (so +Apo
# does not match +Apollo); anything else is a substring search over the
# raw line (full-text search, matching project/tag/desc text alike).
task_matches_filter() {
	_tmf_filter="$1"
	_tmf_line="$2"
	case "$_tmf_filter" in
	+?*)
		case " $P_PROJECTS " in
		*" $_tmf_filter "*) return 0 ;;
		*) return 1 ;;
		esac
		;;
	@?*)
		case " $P_TAGS " in
		*" $_tmf_filter "*) return 0 ;;
		*) return 1 ;;
		esac
		;;
	*)
		case "$_tmf_line" in
		*"$_tmf_filter"*) return 0 ;;
		*) return 1 ;;
		esac
		;;
	esac
}

# collect_view_rows <which> [filter]
# Prints one "sortkey<TAB>id<TAB>raw-line" row per matching task. <which> is
# one of: list, inbox, today, upcoming, someday, logbook.
collect_view_rows() {
	_cvr_which="$1"
	_cvr_filter="${2:-}"
	_cvr_today=$(today)
	_cvr_tab=$(printf '\t')
	_cvr_id=0
	while IFS= read -r _cvr_raw || [ -n "$_cvr_raw" ]; do
		_cvr_id=$((_cvr_id + 1))
		[ -n "$_cvr_raw" ] || continue
		parse_line "$_cvr_raw"

		case "$_cvr_which" in
		logbook) [ "$P_DONE" = "true" ] || continue ;;
		*) [ "$P_DONE" = "false" ] || continue ;;
		esac

		case "$_cvr_which" in
		inbox)
			[ -z "$P_PROJECTS" ] || continue
			;;
		today)
			[ -n "$P_DUE" ] || continue
			expr "$P_DUE" '<=' "$_cvr_today" >/dev/null || continue
			;;
		upcoming)
			[ -n "$P_DUE" ] || continue
			expr "$P_DUE" '>' "$_cvr_today" >/dev/null || continue
			;;
		someday)
			[ -z "$P_DUE" ] || continue
			;;
		esac

		if [ -n "$_cvr_filter" ]; then
			task_matches_filter "$_cvr_filter" "$_cvr_raw" || continue
		fi

		case "$_cvr_which" in
		today | upcoming) _cvr_sortkey="$P_DUE" ;;
		logbook) _cvr_sortkey="${P_COMPLETION_DATE:-0000-00-00}" ;;
		*) _cvr_sortkey=$(printf '%05d' "$_cvr_id") ;;
		esac

		printf '%s%s%s%s%s\n' "$_cvr_sortkey" "$_cvr_tab" "$_cvr_id" "$_cvr_tab" "$_cvr_raw"
	done <"$TODO_FILE"
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

	printf '%s\n' "$_rv_sorted" | while IFS="$_rv_tab" read -r _ _rv_id _rv_line; do
		if [ "$_rv_use_color" = "true" ]; then
			_rv_line=$(colorize_line "$_rv_line")
		fi
		if [ "${SHOW_IDS:-true}" = "false" ]; then
			printf '%s\n' "$_rv_line"
		else
			printf '%s: %s\n' "$_rv_id" "$_rv_line"
		fi
	done
}

# ---------------------------------------------------------------------------
# Usage
# ---------------------------------------------------------------------------

usage() {
	cat <<EOF
headway $HEADWAY_VERSION - organised thinking, in plain text.

Usage: headway <command> [arguments]
       hw <command> [arguments]       (shorter alias, same binary)

Task IDs are the task's current line number in TODO_FILE. They are NOT
stable across edits - deleting or archiving a task shifts the IDs of
every task below it.

Adding:
  add "text [+Project] [due:DATE] [@tag]"   add a task
  a "..."                                   shorthand for add

Completing:
  done <id>                                 mark done (priority -> pri:A)
  undo <id>                                 unmark (restores (A) priority)

Editing:
  edit <id>                                 open task in \$EDITOR
  edit <id> <text>                          replace task line directly
  due <id> <DATE>                           set/update due date
  move <id> +Project                        move to a project
  priority <id> <A-Z|none>                  set or clear priority
  tag <id> @tag                             add a tag
  rm <id>                                   delete permanently

Listing:
  list [+Project|@tag|"keyword"]            list incomplete tasks
  inbox                                     tasks with no project
  today                                     due today, plus overdue
  upcoming                                  future-dated tasks
  someday                                   tasks with no due date
  logbook                                   completed tasks

Projects:
  projects                                  list all projects
  project +Project                          show tasks in a project

Maintenance:
  archive                                   move completed tasks to DONE_FILE
  stats                                     summary counts
  check                                     verify TODO_FILE is well-formed

Interactive:
  shell                                     start an interactive session (default when no command is given)
EOF
}

# ---------------------------------------------------------------------------
# Commands (stubs - implemented incrementally)
# ---------------------------------------------------------------------------

# cmd_add <text> [+Project] [due:DATE] [@tag] [repeat:FREQ]
# Resolves any due: shorthand to a real YYYY-MM-DD before writing, sets
# the creation date to today, and appends the new canonical line to
# TODO_FILE. Project/tag/due/repeat tokens may appear anywhere in <text>;
# everything else becomes the description.
cmd_add() {
	[ "$#" -ge 1 ] || die 'usage: headway add "text [+Project] [due:DATE] [@tag]"'
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
		P_DUE=$(resolve_date_shorthand "$P_DUE") || exit 1
	fi
	[ -n "$P_DESC" ] || die "task description cannot be empty"

	new_line=$(format_line)
	printf '%s\n' "$new_line" >>"$TODO_FILE"
	id=$(awk 'END { print NR }' "$TODO_FILE")
	_display_line="$new_line"
	use_color && _display_line=$(colorize_line "$new_line")
	printf 'added %s: %s\n' "$id" "$_display_line"
}
# cmd_done <id>
# Marks a task done: priority (if any) moves to a trailing pri: extension,
# and the completion date is stamped alongside the original creation date.
# If the task carries repeat:daily|weekly|monthly|yearly, a new occurrence
# is appended with the due date advanced by one interval from the
# completed task's due date (today's date if it had none).
cmd_done() {
	[ "$#" -ge 1 ] || die 'usage: headway done <id>'
	id=$(resolve_id "$1") || exit 1
	raw=$(line_at "$id")
	parse_line "$raw"
	[ "$P_DONE" = "false" ] || die "task $id is already done"

	orig_priority="$P_PRIORITY"
	orig_due="$P_DUE"
	orig_repeat="$P_REPEAT"

	P_DONE=true
	P_COMPLETION_DATE=$(today)
	P_PRI_EXT="$orig_priority"
	P_PRIORITY=""
	completed_line=$(format_line)
	replace_line_at "$id" "$completed_line"
	_display_line="$completed_line"
	use_color && _display_line=$(colorize_line "$completed_line")
	printf 'completed %s: %s\n' "$id" "$_display_line"

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
		_display_line="$next_line"
		use_color && _display_line=$(colorize_line "$next_line")
		printf 'added %s: %s\n' "$next_id" "$_display_line"
	fi
}

# cmd_undo <id>
# Reverses cmd_done: restores the priority marker from pri: (if any) and
# clears the completion date. Byte-identical to the pre-done line.
cmd_undo() {
	[ "$#" -ge 1 ] || die 'usage: headway undo <id>'
	id=$(resolve_id "$1") || exit 1
	raw=$(line_at "$id")
	parse_line "$raw"
	[ "$P_DONE" = "true" ] || die "task $id is not done"

	P_DONE=false
	P_PRIORITY="$P_PRI_EXT"
	P_PRI_EXT=""
	P_COMPLETION_DATE=""
	new_line=$(format_line)
	replace_line_at "$id" "$new_line"
	_display_line="$new_line"
	use_color && _display_line=$(colorize_line "$new_line")
	printf 'undone %s: %s\n' "$id" "$_display_line"
}
# cmd_edit <id> [text]
# With [text], replaces the task's line with it directly (verbatim, same
# as the $EDITOR path below - no due-date shorthand resolution or field
# re-formatting). Without it, opens the task's raw line in $EDITOR via a
# scratch tempfile, then writes back whatever the editor leaves behind.
# Either way, an empty result aborts the edit (the task is left
# unchanged) rather than deleting the task.
cmd_edit() {
	[ "$#" -ge 1 ] || die 'usage: headway edit <id> [text]'
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
	_display_line="$new"
	use_color && _display_line=$(colorize_line "$new")
	printf 'edited %s: %s\n' "$id" "$_display_line"
}

# cmd_due <id> <DATE>
# DATE accepts the same shorthand as `add` (today/+Nd/literal YYYY-MM-DD).
cmd_due() {
	[ "$#" -ge 2 ] || die 'usage: headway due <id> <date>'
	id=$(resolve_id "$1") || exit 1
	new_due=$(resolve_date_shorthand "$2") || exit 1
	parse_line "$(line_at "$id")"
	P_DUE="$new_due"
	new_line=$(format_line)
	replace_line_at "$id" "$new_line"
	_display_line="$new_line"
	use_color && _display_line=$(colorize_line "$new_line")
	printf 'due %s: %s\n' "$id" "$_display_line"
}

# cmd_move <id> +Project
# A task belongs to at most one project at a time; move replaces whatever
# project(s) it had with the given one.
cmd_move() {
	[ "$#" -ge 2 ] || die 'usage: headway move <id> +Project'
	id=$(resolve_id "$1") || exit 1
	project="$2"
	case "$project" in
	+?*) ;;
	*) die "invalid project: $project (must start with +)" ;;
	esac
	parse_line "$(line_at "$id")"
	P_PROJECTS="$project"
	new_line=$(format_line)
	replace_line_at "$id" "$new_line"
	_display_line="$new_line"
	use_color && _display_line=$(colorize_line "$new_line")
	printf 'moved %s: %s\n' "$id" "$_display_line"
}

# cmd_priority <id> <A-Z|none>
# Targets the (A) slot for active tasks, or the pri: extension for
# already-completed ones, since a done line has no (A) position.
cmd_priority() {
	[ "$#" -ge 2 ] || die "usage: headway priority <id> <A-Z|none>"
	id=$(resolve_id "$1") || exit 1
	val="$2"
	case "$val" in
	none) val="" ;;
	[A-Z]) ;;
	*) die "invalid priority: $val (must be A-Z or 'none')" ;;
	esac
	parse_line "$(line_at "$id")"
	if [ "$P_DONE" = "true" ]; then
		P_PRI_EXT="$val"
	else
		P_PRIORITY="$val"
	fi
	new_line=$(format_line)
	replace_line_at "$id" "$new_line"
	_display_line="$new_line"
	use_color && _display_line=$(colorize_line "$new_line")
	printf 'priority %s: %s\n' "$id" "$_display_line"
}

# cmd_tag <id> @tag
# Idempotent: adding a tag the task already has is a silent no-op, not an
# error and not a duplicate.
cmd_tag() {
	[ "$#" -ge 2 ] || die 'usage: headway tag <id> @tag'
	id=$(resolve_id "$1") || exit 1
	tagval="$2"
	case "$tagval" in
	@?*) ;;
	*) die "invalid tag: $tagval (must start with @)" ;;
	esac
	raw=$(line_at "$id")
	parse_line "$raw"
	case " $P_TAGS " in
	*" $tagval "*)
		printf 'task %s already has tag %s\n' "$id" "$tagval"
		return 0
		;;
	esac
	P_TAGS="${P_TAGS:+$P_TAGS }$tagval"
	new_line=$(format_line)
	replace_line_at "$id" "$new_line"
	_display_line="$new_line"
	use_color && _display_line=$(colorize_line "$new_line")
	printf 'tagged %s: %s\n' "$id" "$_display_line"
}

# cmd_rm <id>
# Deletes a task permanently. Prompts for confirmation unless
# CONFIRM_DELETE=false; declining or piping EOF to the prompt cancels
# (the safe default), never deletes.
cmd_rm() {
	[ "$#" -ge 1 ] || die 'usage: headway rm <id>'
	id=$(resolve_id "$1") || exit 1
	raw=$(line_at "$id")

	if [ "$CONFIRM_DELETE" = "true" ]; then
		_prompt_line="$raw"
		use_color_err && _prompt_line=$(colorize_line "$raw")
		printf 'remove task %s: %s\nAre you sure? [y/N] ' "$id" "$_prompt_line" >&2
		reply=""
		read -r reply || reply=""
		case "$reply" in
		y | Y | yes | YES) ;;
		*)
			printf 'cancelled\n'
			return 0
			;;
		esac
	fi

	awk -v id="$id" 'NR != id' "$TODO_FILE" | safe_write "$TODO_FILE"
	_display_line="$raw"
	use_color && _display_line=$(colorize_line "$raw")
	printf 'removed %s: %s\n' "$id" "$_display_line"
}
# cmd_list [+Project|@tag|"keyword"]
cmd_list() { render_view "list" "${1:-}"; }
# cmd_inbox [+Project|@tag|"keyword"] - incomplete tasks with no project
cmd_inbox() { render_view "inbox" "${1:-}"; }
# cmd_today [+Project|@tag|"keyword"] - due today, plus anything overdue
cmd_today() { render_view "today" "${1:-}"; }
# cmd_upcoming [+Project|@tag|"keyword"] - future-dated tasks
cmd_upcoming() { render_view "upcoming" "${1:-}"; }
# cmd_someday [+Project|@tag|"keyword"] - tasks with no due date
cmd_someday() { render_view "someday" "${1:-}"; }
# cmd_logbook [+Project|@tag|"keyword"] - completed tasks, most recent first
cmd_logbook() { render_view "logbook" "${1:-}"; }
# cmd_projects
# Lists the distinct +Project tokens carried by incomplete tasks, one per
# line, sorted alphabetically.
cmd_projects() {
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

# cmd_project +Project
# Thin wrapper over the list view, filtered to a single project.
cmd_project() {
	[ "$#" -ge 1 ] || die 'usage: headway project +Project'
	case "$1" in
	+?*) ;;
	*) die "invalid project: $1 (must start with +)" ;;
	esac
	render_view "list" "$1"
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

# cmd_stats
# Summary counts: active vs. done totals, a count per view, and a count
# per project (across incomplete tasks).
cmd_stats() {
	if [ ! -f "$TODO_FILE" ]; then
		printf 'tasks:    0 active, 0 done (0 total)\n'
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

	printf 'tasks:    %s active, %s done (%s total)\n' "$active" "$done_count" "$total"
	printf 'inbox:    %s\n' "$(render_view inbox | awk 'END { print NR }')"
	printf 'today:    %s\n' "$(render_view today | awk 'END { print NR }')"
	printf 'upcoming: %s\n' "$(render_view upcoming | awk 'END { print NR }')"
	printf 'someday:  %s\n' "$(render_view someday | awk 'END { print NR }')"

	projects=$(cmd_projects)
	if [ -n "$projects" ]; then
		printf 'projects:\n'
		printf '%s\n' "$projects" | while IFS= read -r proj; do
			proj_count=$(render_view list "$proj" | awk 'END { print NR }')
			printf '  %-20s %s\n' "$proj" "$proj_count"
		done
	fi
}

# cmd_check
# Verifies TODO_FILE is well-formed. Prints "line <N>: <message>" to
# stderr for every problem found; exits 0 if clean, 1 otherwise. Checks:
# blank lines, malformed priority markers, invalid due: dates, repeat:
# values outside daily/weekly/monthly/yearly, and completed lines missing
# either date.
cmd_check() {
	[ -f "$TODO_FILE" ] || die "no such file: $TODO_FILE"
	problems=0
	id=0
	while IFS= read -r raw || [ -n "$raw" ]; do
		id=$((id + 1))

		if [ -z "$raw" ]; then
			printf 'line %s: blank line\n' "$id" >&2
			problems=$((problems + 1))
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
				*)
					printf 'line %s: malformed priority marker\n' "$id" >&2
					problems=$((problems + 1))
					;;
				esac
				;;
			esac
		else
			case "$raw" in
			'x '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]' '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]' '*) ;;
			'x '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]' '*)
				printf 'line %s: completed task missing creation date\n' "$id" >&2
				problems=$((problems + 1))
				;;
			*)
				printf 'line %s: completed task missing completion date\n' "$id" >&2
				problems=$((problems + 1))
				;;
			esac
		fi

		set -f
		for tok in $raw; do
			case "$tok" in
			due:*)
				dueval="${tok#due:}"
				if ! is_valid_date "$dueval"; then
					printf 'line %s: invalid due date: %s\n' "$id" "$dueval" >&2
					problems=$((problems + 1))
				fi
				;;
			repeat:*)
				repeatval="${tok#repeat:}"
				case "$repeatval" in
				daily | weekly | monthly | yearly) ;;
				*)
					printf 'line %s: invalid repeat value: %s\n' "$id" "$repeatval" >&2
					problems=$((problems + 1))
					;;
				esac
				;;
			esac
		done
		set +f
	done <"$TODO_FILE"

	[ "$problems" -eq 0 ]
}

# ---------------------------------------------------------------------------
# Dispatch
# ---------------------------------------------------------------------------

# dispatch_cmd <command> [arguments...]
# The single source of truth for mapping a command name to its cmd_*
# function. Shared by main() (one-shot invocation) and cmd_shell() (the
# interactive loop) so the two never drift out of sync.
dispatch_cmd() {
	cmd="${1:-}"
	[ "$#" -gt 0 ] && shift

	case "$cmd" in
	add | a) cmd_add "$@" ;;
	done) cmd_done "$@" ;;
	undo) cmd_undo "$@" ;;
	edit) cmd_edit "$@" ;;
	due) cmd_due "$@" ;;
	move) cmd_move "$@" ;;
	priority) cmd_priority "$@" ;;
	tag) cmd_tag "$@" ;;
	rm) cmd_rm "$@" ;;
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
	"" | shell | repl) cmd_shell ;;
	*)
		err "unknown command: $cmd"
		usage
		return 1
		;;
	esac
}

# shell_open_count
# Prints the number of open (not completed) tasks in TODO_FILE.
shell_open_count() {
	[ -f "$TODO_FILE" ] || return 0

	awk '{ if (substr($0, 1, 2) != "x ") n++ } END { print n + 0 }' "$TODO_FILE"
}

# shell_summary
# Prints a one-line count of open tasks and how many are due today (which,
# per render_view's "today" rules, includes anything overdue), for callers
# that still want the old compact summary.
shell_summary() {
	[ -f "$TODO_FILE" ] || return 0

	active=$(shell_open_count)
	if [ "$active" -eq 0 ]; then
		printf 'No open tasks - you are all caught up.\n'
		return 0
	fi

	due_today=$(render_view today | awk 'END { print NR + 0 }')

	task_word="tasks"
	[ "$active" -eq 1 ] && task_word="task"

	if [ "$due_today" -gt 0 ]; then
		due_word="tasks"
		[ "$due_today" -eq 1 ] && due_word="task"
		printf '%s open %s, %s %s due today.\n' "$active" "$task_word" "$due_today" "$due_word"
	else
		printf '%s open %s.\n' "$active" "$task_word"
	fi
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

	printf '%s\n' "$_swg_rows" | while IFS="$_swg_tab" read -r _swg_due _swg_id _swg_raw; do
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

# shell_welcome_more_count <rows> <today> <group>
# Prints how many rows would remain after shell_welcome_group's first three.
shell_welcome_more_count() {
	_swm_rows="$1"
	_swm_today="$2"
	_swm_group="$3"
	_swm_tab=$(printf '\t')

	[ -n "$_swm_rows" ] || {
		printf '0\n'
		return 0
	}

	printf '%s\n' "$_swm_rows" | while IFS="$_swm_tab" read -r _swm_due _ _; do
		case "$_swm_group" in
		overdue)
			expr "$_swm_due" '<' "$_swm_today" >/dev/null || continue
			;;
		today)
			[ "$_swm_due" = "$_swm_today" ] || continue
			;;
		esac
		printf '.\n'
	done | awk 'END { extra = NR - 3; if (extra < 0) extra = 0; print extra }'
}

# shell_welcome_count <rows> <today> <group>
shell_welcome_count() {
	_swc_rows="$1"
	_swc_today="$2"
	_swc_group="$3"
	_swc_tab=$(printf '\t')

	[ -n "$_swc_rows" ] || {
		printf '0\n'
		return 0
	}

	printf '%s\n' "$_swc_rows" | while IFS="$_swc_tab" read -r _swc_due _ _; do
		case "$_swc_group" in
		overdue)
			expr "$_swc_due" '<' "$_swc_today" >/dev/null || continue
			;;
		today)
			[ "$_swc_due" = "$_swc_today" ] || continue
			;;
		esac
		printf '.\n'
	done | awk 'END { print NR + 0 }'
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
	_swb_overdue_count=$(shell_welcome_count "$_swb_rows" "$_swb_today" overdue)
	_swb_today_count=$(shell_welcome_count "$_swb_rows" "$_swb_today" today)
	_swb_use_color=false
	use_color_err && _swb_use_color=true

	_swb_version="headway v$HEADWAY_VERSION"
	_swb_hint='Type "help" for commands, "exit" to leave.'
	if [ "$_swb_use_color" = "true" ]; then
		_swb_version=$(sgr_wrap "$THEME_DATE" "$_swb_version")
		_swb_hint=$(sgr_wrap "$THEME_DATE" "$_swb_hint")
	fi

	printf '%s\n' "$_swb_version"
	printf '%s!\n' "$(greeting)"

	if [ "$_swb_due_count" -gt 0 ]; then
		_swb_due_text=$_swb_due_count
		[ "$_swb_use_color" = "true" ] && _swb_due_text=$(sgr_wrap "$THEME_DUE" "$_swb_due_text")
		_swb_due_word="tasks"
		[ "$_swb_due_count" -eq 1 ] && _swb_due_word="task"
		printf '%s %s due.\n' "$_swb_due_text" "$_swb_due_word"
	else
		_swb_task_word="tasks"
		[ "$_swb_active" -eq 1 ] && _swb_task_word="task"
		printf '%s open %s, nothing due today.\n' "$_swb_active" "$_swb_task_word"
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
			_swb_more=$(shell_welcome_more_count "$_swb_rows" "$_swb_today" overdue)
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
			_swb_more=$(shell_welcome_more_count "$_swb_rows" "$_swb_today" today)
			[ "$_swb_more" -gt 0 ] && printf "  … %s more — see 'today'\n" "$_swb_more"
		fi
	fi

	printf '\n%s\n\n' "$_swb_hint"
}

# tokenize_line <line>
# Splits <line> into $US-joined words the way a shell command line would
# be split - but WITHOUT evaluating it as shell code. Single/double quotes
# group words and are stripped; their contents are copied verbatim. $VAR,
# `cmd`, $(cmd), and globs are never expanded - a todo-item REPL has no
# legitimate use for shell expansion, so not expanding it is the fix, not
# a limitation. Prints the joined tokens and returns 0, or prints nothing
# and returns 1 if a quote is left unterminated. Walks the string one
# character at a time via parameter expansion (no per-character fork).
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

# _rli_backspace / _rli_forward_delete
# Delete the character left of / at the cursor. No-ops at either edge.
_rli_backspace() {
	[ -n "$_rli_before" ] || return 0
	_rli_before="${_rli_before%?}"
}

_rli_forward_delete() {
	[ -n "$_rli_after" ] || return 0
	_rli_after="${_rli_after#?}"
}

# _rli_cursor_left / _rli_cursor_right
# Move one character between $_rli_before and $_rli_after. No-ops at
# either edge. The "last character of" idiom is the mirror image of
# tokenize_line's "first character of" one - easy to get backwards:
# first-char-of $x is ${x%"${x#?}"}, last-char-of $x is ${x#"${x%?}"}.
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

# _rli_cursor_home / _rli_cursor_end
_rli_cursor_home() {
	_rli_after="$_rli_before$_rli_after"
	_rli_before=""
}

_rli_cursor_end() {
	_rli_before="$_rli_before$_rli_after"
	_rli_after=""
}

# _rli_redraw
# Full-line redraw: return to column 0, erase to end of line, reprint the
# prompt and buffer, then reposition the cursor by moving left len($after)
# columns. Simple and robust at human typing speed - no need to diff
# against the previous draw. Goes to stderr, same as the prompt/banner
# (stdout stays clean for command output).
_rli_redraw() {
	printf '\r\033[K' >&2
	printf 'headway $ %s%s' "$_rli_before" "$_rli_after" >&2
	if [ -n "$_rli_after" ]; then
		printf '\033[%dD' "${#_rli_after}" >&2
	fi
}

# _rli_handle_esc
# Reads and dispatches the byte(s) following an ESC that read_line_interactive
# already consumed. Recognises arrow keys, Home/End (both single-letter and
# numbered-tilde encodings, terminal-dependent), Delete, and Page Up/Down
# (repurposed as 10-entry history jumps, since raw mode intercepts these
# bytes before a terminal emulator's own scrollback ever sees them).
# Unrecognised or partial sequences are silently discarded. Returns 1 only
# on true EOF while reading a continuation byte; check $_rli_interrupted
# after calling, same as the main loop does around every read.
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

# _rli_cleanup
# Restores the terminal to whatever mode it was in before
# read_line_interactive touched it, and clears the INT trap. Called at
# every exit path - normal Enter, EOF, Ctrl-D, Ctrl-C.
_rli_cleanup() {
	stty "$_rli_saved_stty" 2>/dev/null
	trap - INT
}

# read_line_interactive
# One interactively-edited line: arrow keys, Home/End, Backspace/Delete,
# and Up/Down/PgUp/PgDn history all work. Prints the finished line to
# stdout with no trailing newline (matching how it's consumed via command
# substitution). Returns 0 on Enter, 1 on true EOF or Ctrl-D on an empty
# line (same contract as `read -r` - the caller ends the session), or 130
# on Ctrl-C (abort this line only, caller should reprompt).
#
# Raw mode is scoped to this one call, not the whole cmd_shell session:
# $EDITOR (via cmd_edit) and the confirmation prompt (via cmd_rm) both run
# from the same loop between line reads and need normal canonical-mode
# terminal behaviour, so it must never leak past a single line.
#
# Ctrl-C is handled via a real SIGINT (stty here never touches isig, so
# signal generation stays on) rather than reading byte 0x03 directly: the
# trap only sets a flag, and every read checks it afterward, rather than
# trying to `return` multiple stack frames from inside the trap itself,
# which is not reliably portable across shells when the signal lands
# while a nested read is blocked.
read_line_interactive() {
	_rli_before=""
	_rli_after=""
	_rli_interrupted=false
	_rli_saved_stty=$(stty -g 2>/dev/null) || return 1
	stty -icanon -echo min 1 time 0 2>/dev/null

	_rli_hist_count=$(_rli_history_count)
	_rli_hist_pos=$((_rli_hist_count + 1))
	_rli_hist_saved=""

	# printf '\n' alone would have its trailing newline stripped by
	# command substitution, leaving $_rli_nl empty (same issue
	# _rli_read_byte's sentinel trick solves) - append and strip a
	# sentinel here too so the comparison below actually matches Enter.
	_rli_nl=$(printf '\nX')
	_rli_nl="${_rli_nl%X}"
	_rli_del=$(printf '\177')
	_rli_bs=$(printf '\010')
	_rli_esc=$(printf '\033')
	_rli_ctrld=$(printf '\004')

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

# cmd_shell
# Starts an interactive session: repeatedly prompts for a line, splits it
# into arguments the same way a shell command line would be, and runs it
# through dispatch_cmd. On a real terminal, read_line_interactive gives
# arrow-key cursor movement and Up/Down/PgUp/PgDn history (see its comment
# for how); piped/non-tty input falls back to plain `read -r`, unchanged.
# `exit`/`quit` ends the session; EOF (Ctrl-D) does the same.
cmd_shell() {
	if [ -t 0 ]; then
		# read_line_interactive runs inside a $(...) subshell (forked for
		# the command substitution), so its own INT trap only protects
		# that subshell. SIGINT is delivered to the whole foreground
		# process group, so without a trap here too, this outer process
		# would die to the default disposition before it ever saw the
		# subshell's result. Ignoring it here is what makes Ctrl-C abort
		# only the current line being typed, not the whole session -
		# matching how interactive REPLs (bash, python, etc.) behave.
		trap '' INT
		shell_welcome_banner >&2
	fi

	while :; do
		if [ -t 0 ]; then
			printf 'headway $ ' >&2
			# Deliberately not `if ! line=$(read_line_interactive); then`:
			# `!` negates the exit status, so a $? read afterward would
			# see the negated 0/1 boolean, never read_line_interactive's
			# real 130 (Ctrl-C) vs 1 (EOF) distinction. Capturing it via
			# `|| _sh_rc=$?` keeps the real code intact.
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
		set -- $_sh_tokens
		set +f
		IFS="$_sh_old_ifs"

		[ "$#" -eq 0 ] && continue

		case "$1" in
		exit | quit) break ;;
		help | '?')
			usage
			continue
			;;
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

main() {
	cmd="${1:-}"
	[ "$#" -gt 0 ] && shift

	case "$cmd" in
	-h | --help | help)
		usage
		return 0
		;;
	esac

	load_config
	detect_date_flavor

	dispatch_cmd "$cmd" "$@"
}

# Allow this script to be sourced as a library (e.g. by tests that want to
# call parse_line/format_line directly) without executing main().
if [ "${HEADWAY_LIB_ONLY:-false}" != "true" ]; then
	main "$@"
fi
