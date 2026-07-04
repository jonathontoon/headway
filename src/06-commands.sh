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
