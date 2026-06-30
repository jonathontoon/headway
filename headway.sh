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

# ---------------------------------------------------------------------------
# Generic helpers
# ---------------------------------------------------------------------------

err() {
	printf 'hw: %s\n' "$1" >&2
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
		printf '%s\n' "$HOME/${1#~/}"
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
	case "$COLOR" in
	true) return 0 ;;
	false) return 1 ;;
	*) [ -t 1 ] ;;
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
	else
		die "unsupported date(1) implementation: cannot detect GNU or BSD flavor"
	fi
}

# today
# Prints today's date as YYYY-MM-DD. Flavor-independent: both GNU and BSD
# date support a bare `+FORMAT` invocation with no other arguments.
today() {
	date "+%Y-%m-%d"
}

# date_add_days <YYYY-MM-DD> <signed-offset>
date_add_days() {
	base="$1"
	offset="$2"
	case "$DATE_FLAVOR" in
	gnu) date -d "$base + $offset day" "+%Y-%m-%d" ;;
	bsd) date -j -v"${offset}"d -f "%Y-%m-%d" "$base" "+%Y-%m-%d" ;;
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
	esac
}

# date_add_years <YYYY-MM-DD> <signed-offset>
date_add_years() {
	base="$1"
	offset="$2"
	case "$DATE_FLAVOR" in
	gnu) date -d "$base + $offset year" "+%Y-%m-%d" ;;
	bsd) date -j -v"${offset}"y -f "%Y-%m-%d" "$base" "+%Y-%m-%d" ;;
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
# than defensively parsed.
load_config() {
	config_path="${HEADWAY_CONFIG:-$HOME/.config/headway/config}"
	if [ -f "$config_path" ]; then
		# shellcheck disable=SC1090
		. "$config_path"
	fi

	: "${TODO_FILE:=$TODO_FILE_DEFAULT}"
	: "${DONE_FILE:=$DONE_FILE_DEFAULT}"
	: "${EDITOR:=$EDITOR_DEFAULT}"
	: "${COLOR:=$COLOR_DEFAULT}"
	: "${DATE_FORMAT:=$DATE_FORMAT_DEFAULT}"
	: "${SHOW_IDS:=$SHOW_IDS_DEFAULT}"
	: "${AUTO_ARCHIVE:=$AUTO_ARCHIVE_DEFAULT}"
	: "${CONFIRM_DELETE:=$CONFIRM_DELETE_DEFAULT}"

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

	printf '%s\n' "$_rv_sorted" | while IFS="$_rv_tab" read -r _ _rv_id _rv_line; do
		printf '%s: %s\n' "$_rv_id" "$_rv_line"
	done
}

# ---------------------------------------------------------------------------
# Usage
# ---------------------------------------------------------------------------

usage() {
	cat <<EOF
headway $HEADWAY_VERSION - organised thinking, in plain text.

Usage: hw <command> [arguments]

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
	[ "$#" -ge 1 ] || die 'usage: hw add "text [+Project] [due:DATE] [@tag]"'
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
	printf 'added %s: %s\n' "$id" "$new_line"
}
# cmd_done <id>
# Marks a task done: priority (if any) moves to a trailing pri: extension,
# and the completion date is stamped alongside the original creation date.
# If the task carries repeat:daily|weekly|monthly|yearly, a new occurrence
# is appended with the due date advanced by one interval from the
# completed task's due date (today's date if it had none).
cmd_done() {
	[ "$#" -ge 1 ] || die 'usage: hw done <id>'
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
	printf 'completed %s: %s\n' "$id" "$completed_line"

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
		printf 'added %s: %s\n' "$next_id" "$next_line"
	fi
}

# cmd_undo <id>
# Reverses cmd_done: restores the priority marker from pri: (if any) and
# clears the completion date. Byte-identical to the pre-done line.
cmd_undo() {
	[ "$#" -ge 1 ] || die 'usage: hw undo <id>'
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
	printf 'undone %s: %s\n' "$id" "$new_line"
}
# cmd_edit <id>
# Opens the task's raw line in $EDITOR via a scratch tempfile, then writes
# back whatever the editor leaves behind. An empty result aborts the edit
# (the task is left unchanged) rather than deleting the task.
cmd_edit() {
	[ "$#" -ge 1 ] || die 'usage: hw edit <id>'
	id=$(resolve_id "$1") || exit 1
	raw=$(line_at "$id")
	tmp=$(mktemp) || die "mktemp failed"
	printf '%s\n' "$raw" >"$tmp"
	if ! $EDITOR "$tmp"; then
		rm -f "$tmp"
		die "editor exited non-zero, task $id unchanged"
	fi
	new=$(cat "$tmp")
	rm -f "$tmp"
	[ -n "$new" ] || die "empty edit aborted, task $id unchanged"
	replace_line_at "$id" "$new"
	printf 'edited %s: %s\n' "$id" "$new"
}

# cmd_due <id> <DATE>
# DATE accepts the same shorthand as `add` (today/+Nd/literal YYYY-MM-DD).
cmd_due() {
	[ "$#" -ge 2 ] || die 'usage: hw due <id> <date>'
	id=$(resolve_id "$1") || exit 1
	new_due=$(resolve_date_shorthand "$2") || exit 1
	parse_line "$(line_at "$id")"
	P_DUE="$new_due"
	new_line=$(format_line)
	replace_line_at "$id" "$new_line"
	printf 'due %s: %s\n' "$id" "$new_line"
}

# cmd_move <id> +Project
# A task belongs to at most one project at a time; move replaces whatever
# project(s) it had with the given one.
cmd_move() {
	[ "$#" -ge 2 ] || die 'usage: hw move <id> +Project'
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
	printf 'moved %s: %s\n' "$id" "$new_line"
}

# cmd_priority <id> <A-Z|none>
# Targets the (A) slot for active tasks, or the pri: extension for
# already-completed ones, since a done line has no (A) position.
cmd_priority() {
	[ "$#" -ge 2 ] || die "usage: hw priority <id> <A-Z|none>"
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
	printf 'priority %s: %s\n' "$id" "$new_line"
}

# cmd_tag <id> @tag
# Idempotent: adding a tag the task already has is a silent no-op, not an
# error and not a duplicate.
cmd_tag() {
	[ "$#" -ge 2 ] || die 'usage: hw tag <id> @tag'
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
	printf 'tagged %s: %s\n' "$id" "$new_line"
}

# cmd_rm <id>
# Deletes a task permanently. Prompts for confirmation unless
# CONFIRM_DELETE=false; declining or piping EOF to the prompt cancels
# (the safe default), never deletes.
cmd_rm() {
	[ "$#" -ge 1 ] || die 'usage: hw rm <id>'
	id=$(resolve_id "$1") || exit 1
	raw=$(line_at "$id")

	if [ "$CONFIRM_DELETE" = "true" ]; then
		printf 'remove task %s: %s\nAre you sure? [y/N] ' "$id" "$raw" >&2
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
	printf 'removed %s: %s\n' "$id" "$raw"
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
cmd_projects() { die "not implemented: projects"; }
cmd_project() { die "not implemented: project"; }
cmd_archive() { die "not implemented: archive"; }
cmd_stats() { die "not implemented: stats"; }
cmd_check() { die "not implemented: check"; }

# ---------------------------------------------------------------------------
# Dispatch
# ---------------------------------------------------------------------------

main() {
	cmd="${1:-}"
	[ "$#" -gt 0 ] && shift

	case "$cmd" in
	"" | -h | --help | help)
		usage
		return 0
		;;
	esac

	load_config
	detect_date_flavor

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
	*)
		err "unknown command: $cmd"
		usage
		return 1
		;;
	esac
}

# Allow this script to be sourced as a library (e.g. by tests that want to
# call parse_line/format_line directly) without executing main().
if [ "${HEADWAY_LIB_ONLY:-false}" != "true" ]; then
	main "$@"
fi
