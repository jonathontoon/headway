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

cmd_add() { die "not implemented: add"; }
cmd_done() { die "not implemented: done"; }
cmd_undo() { die "not implemented: undo"; }
cmd_edit() { die "not implemented: edit"; }
cmd_due() { die "not implemented: due"; }
cmd_move() { die "not implemented: move"; }
cmd_priority() { die "not implemented: priority"; }
cmd_tag() { die "not implemented: tag"; }
cmd_rm() { die "not implemented: rm"; }
cmd_list() { die "not implemented: list"; }
cmd_inbox() { die "not implemented: inbox"; }
cmd_today() { die "not implemented: today"; }
cmd_upcoming() { die "not implemented: upcoming"; }
cmd_someday() { die "not implemented: someday"; }
cmd_logbook() { die "not implemented: logbook"; }
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
