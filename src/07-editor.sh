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

	# Classify.
	case "$_rli_tab_partial" in
	+*) _rli_tab_src="projects" ;;
	@*) _rli_tab_src="tags" ;;
	*)
		[ "$_rli_tab_hasprefix" = "false" ] || return 0
		_rli_tab_src="commands"
		;;
	esac

	case "$_rli_tab_src" in
	projects) _rli_tab_cands=$(cmd_projects 2>/dev/null || true) ;;
	tags) _rli_tab_cands=$(_hw_tags_in_todo) ;;
	commands) _rli_tab_cands=$(headway_commands | tr ' ' '\n') ;;
	esac
	[ -n "$_rli_tab_cands" ] || return 0

	# Filter to prefix matches, tallying as we go.
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
		# Rebuild _rli_before as (prefix minus partial) + match + " ".
		# Reconstructing from $_rli_tab_pre avoids ${var%$pat} - the
		# partial can contain glob metacharacters.
		_rli_before="${_rli_tab_pre}${_rli_tab_first} "
	else
		# Multi-match: list candidates below the current prompt. The main
		# loop's _rli_redraw then reprints prompt+buffer on a fresh line.
		printf '\n' >&2
		printf '%s' "$_rli_tab_matches" | while IFS= read -r _rli_tab_m; do
			[ -n "$_rli_tab_m" ] && printf '  %s\n' "$_rli_tab_m" >&2
		done
	fi
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
# $EDITOR (via cmd_edit) and the confirmation prompt (via cmd_delete) both run
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

# cmd_shell
# Starts an interactive session: repeatedly prompts for a line, splits it
# into arguments the same way a shell command line would be, and runs it
# through dispatch_cmd. On a real terminal, read_line_interactive gives
# arrow-key cursor movement and Up/Down/PgUp/PgDn history (see its comment
# for how); piped/non-tty input falls back to plain `read -r`, unchanged.
# `exit` ends the session; EOF (Ctrl-D) does the same.
