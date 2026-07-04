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

# shell_cache_refresh
# Refreshes the parsed task rows inherited by subshell-dispatched commands.
shell_cache_refresh() {
	if [ -f "$TODO_FILE" ]; then
		HEADWAY_SHELL_TASK_ROWS=$(collect_task_rows)
	else
		HEADWAY_SHELL_TASK_ROWS=""
	fi
}

# shell_command_mutates <command>
# True for REPL commands that can change TODO_FILE or DONE_FILE.
shell_command_mutates() {
	case "$1" in
	add | complete | undo | edit | due | priority | tag | clear | delete | project | archive)
		return 0
		;;
	*)
		return 1
		;;
	esac
}

# shell_open_count
# Prints the number of open (not completed) tasks in TODO_FILE.
shell_open_count() {
	if cached_task_rows_active; then
		printf '%s\n' "$HEADWAY_SHELL_TASK_ROWS" | awk -F "$(printf '\t')" '$2 != "true" { n++ } END { print n + 0 }'
		return 0
	fi

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

	printf '%s\n' "$_swg_rows" | while IFS="$_swg_tab" read -r _ _swg_id _swg_due _ _ _swg_raw; do
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

	printf '%s\n' "$_swc_rows" | while IFS="$_swc_tab" read -r _ _ _swc_due _ _ _; do
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
	_swb_use_color=false
	use_color_err && _swb_use_color=true
	_swb_color_on=0
	[ "$_swb_use_color" = "true" ] && _swb_color_on=1
	_swb_rows=""
	if [ -f "$TODO_FILE" ]; then
		_swb_tab=$(printf '\t')
		_swb_rows=$(collect_view_rows today "" "$_swb_color_on" | sort -t "$_swb_tab" -k1,1)
	fi
	_swb_due_count=$(printf '%s\n' "$_swb_rows" | awk 'NF { n++ } END { print n + 0 }')
	_swb_overdue_count=$(shell_welcome_count "$_swb_rows" "$_swb_today" overdue 0)
	_swb_today_count=$(shell_welcome_count "$_swb_rows" "$_swb_today" today 0)

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
	HEADWAY_SHELL_CACHE_ACTIVE=true
	shell_cache_refresh

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
		if shell_command_mutates "$1"; then
			shell_cache_refresh
		fi
	done
}
