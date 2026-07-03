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

