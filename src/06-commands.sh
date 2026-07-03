# ---------------------------------------------------------------------------
# Commands
# ---------------------------------------------------------------------------

# cmd_add <text> [+Project] [due:DATE] [@tag] [repeat:FREQ]
# Resolves any due: shorthand to a real YYYY-MM-DD before writing, sets
# the creation date to today, and appends the new canonical line to
# TODO_FILE. Project/tag/due/repeat tokens may appear anywhere in <text>;
# everything else becomes the description.
cmd_add() {
	_u='usage: headway add "text [+Project] [due:DATE] [@tag]"'
	case "${1:-}" in --help) printf '%s\n' "$_u"; return 0 ;; esac
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
		P_DUE=$(resolve_date_shorthand "$P_DUE") || exit 1
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
	case "${1:-}" in --help) printf '%s\n' "$_u"; return 0 ;; esac
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
	case "${1:-}" in --help) printf '%s\n' "$_u"; return 0 ;; esac
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
# as the $EDITOR path below - no due-date shorthand resolution or field
# re-formatting). Without it, opens the task's raw line in $EDITOR via a
# scratch tempfile, then writes back whatever the editor leaves behind.
# Either way, an empty result aborts the edit (the task is left
# unchanged) rather than deleting the task.
cmd_edit() {
	_u='usage: headway edit <id> [text]'
	case "${1:-}" in --help) printf '%s\n' "$_u"; return 0 ;; esac
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

# cmd_due <id> <DATE|none>
# DATE accepts the same shorthand as `add` (today/+Nd/literal YYYY-MM-DD).
# `none` clears the task's due date, restoring it to someday.
cmd_due() {
	_u='usage: headway due <id> <date|none>'
	case "${1:-}" in --help) printf '%s\n' "$_u"; return 0 ;; esac
	[ "$#" -ge 2 ] || usage_die "$_u"
	require_todo_file
	id=$(resolve_id "$1") || exit 1
	case "$2" in
	none) new_due="" ;;
	*) new_due=$(resolve_date_shorthand "$2") || exit 1 ;;
	esac
	parse_line "$(line_at "$id")"
	P_DUE="$new_due"
	new_line=$(format_line)
	replace_line_at "$id" "$new_line"
	report_change "due" "$id" "$new_line"
}

# (cmd_move was removed - its set-a-task's-project role is now the
# id-shaped form of cmd_project below.)

# cmd_priority <id> <A-Z|none>
# Targets the (A) slot for active tasks, or the pri: extension for
# already-completed ones, since a done line has no (A) position.
cmd_priority() {
	_u='usage: headway priority <id> <A-Z|none>'
	case "${1:-}" in --help) printf '%s\n' "$_u"; return 0 ;; esac
	[ "$#" -ge 2 ] || usage_die "$_u"
	require_todo_file
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
	report_change "priority" "$id" "$new_line"
}

# cmd_tag <id> @tag | -@tag | none
# Adds @tag (idempotent - silent no-op if the task already has it),
# removes @tag when written as -@tag, or clears every tag on the task
# when the value is `none`.
cmd_tag() {
	_u='usage: headway tag <id> <@tag|-@tag|none>'
	case "${1:-}" in --help) printf '%s\n' "$_u"; return 0 ;; esac
	[ "$#" -ge 2 ] || usage_die "$_u"
	require_todo_file
	id=$(resolve_id "$1") || exit 1
	tagval="$2"
	raw=$(line_at "$id")
	parse_line "$raw"

	case "$tagval" in
	none)
		P_TAGS=""
		_ct_action="cleared tags on"
		;;
	-@?*)
		_ct_target="${tagval#-}"
		_ct_new=""
		_ct_found=false
		for _ct_t in $P_TAGS; do
			if [ "$_ct_t" = "$_ct_target" ]; then
				_ct_found=true
			else
				_ct_new="${_ct_new:+$_ct_new }$_ct_t"
			fi
		done
		if [ "$_ct_found" = "false" ]; then
			printf 'task %s has no tag %s\n' "$id" "$_ct_target"
			return 0
		fi
		P_TAGS="$_ct_new"
		_ct_action="untagged $_ct_target on"
		;;
	@?*)
		case " $P_TAGS " in
		*" $tagval "*)
			printf 'task %s already has tag %s\n' "$id" "$tagval"
			return 0
			;;
		esac
		P_TAGS="${P_TAGS:+$P_TAGS }$tagval"
		_ct_action="tagged"
		;;
	*)
		die "invalid tag value: $tagval (want @tag, -@tag, or 'none')"
		;;
	esac

	new_line=$(format_line)
	replace_line_at "$id" "$new_line"
	report_change "$_ct_action" "$id" "$new_line"
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
	case "${1:-}" in --help) printf '%s\n' "$_u"; return 0 ;; esac
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
# cmd_show <id>
# Prints a labelled detail block for a single task - the inverse of the
# one-liner render_view uses. Handy when the task line is long enough to
# wrap in a normal listing, or when you want the field names spelled out
# rather than encoded as +Project / @tag / due: / repeat:.
cmd_show() {
	_u='usage: headway show <id>'
	case "${1:-}" in --help) printf '%s\n' "$_u"; return 0 ;; esac
	[ "$#" -ge 1 ] || usage_die "$_u"
	require_todo_file
	id=$(resolve_id "$1") || exit 1
	parse_line "$(line_at "$id")"

	_cs_status="open"
	[ "$P_DONE" = "true" ] && _cs_status="done"
	_cs_pri="${P_PRIORITY:-${P_PRI_EXT:-}}"

	printf 'id:         %s\n' "$id"
	printf 'status:     %s\n' "$_cs_status"
	[ -n "$_cs_pri" ] && printf 'priority:   %s\n' "$_cs_pri"
	[ -n "$P_DESC" ] && printf 'desc:       %s\n' "$P_DESC"
	[ -n "$P_PROJECTS" ] && printf 'project:    %s\n' "$P_PROJECTS"
	[ -n "$P_TAGS" ] && printf 'tags:       %s\n' "$P_TAGS"
	[ -n "$P_DUE" ] && printf 'due:        %s\n' "$P_DUE"
	[ -n "$P_REPEAT" ] && printf 'repeat:     %s\n' "$P_REPEAT"
	[ -n "$P_CREATION_DATE" ] && printf 'created:    %s\n' "$P_CREATION_DATE"
	[ -n "$P_COMPLETION_DATE" ] && printf 'completed:  %s\n' "$P_COMPLETION_DATE"
	# The final [ -n "" ] && printf ... returns 1 when the field is empty;
	# an explicit return keeps cmd_show's exit code aligned with success.
	return 0
}

# cmd_list [+Project|@tag|"keyword"]
# With no filter, prints tasks grouped into Overdue / Due today / Upcoming
# / Someday (headers appear only if two or more of those buckets have
# entries). With a filter, prints a flat list - a targeted query wants
# its results contiguous, not carved into sections.
cmd_list() {
	case "${1:-}" in --help) printf 'usage: headway list [+Project|@tag|"keyword"]\n'; return 0 ;; esac
	if [ "$#" -ge 1 ] && [ -n "$1" ]; then
		render_view "list" "$1"
	else
		render_grouped_list
	fi
}
# cmd_inbox [+Project|@tag|"keyword"] - incomplete tasks with no project
cmd_inbox() {
	case "${1:-}" in --help) printf 'usage: headway inbox [+Project|@tag|"keyword"]\n'; return 0 ;; esac
	render_view "inbox" "${1:-}"
}
# cmd_today [+Project|@tag|"keyword"] - due today, plus anything overdue
cmd_today() {
	case "${1:-}" in --help) printf 'usage: headway today [+Project|@tag|"keyword"]\n'; return 0 ;; esac
	render_view "today" "${1:-}"
}
# cmd_upcoming [+Project|@tag|"keyword"] - future-dated tasks
cmd_upcoming() {
	case "${1:-}" in --help) printf 'usage: headway upcoming [+Project|@tag|"keyword"]\n'; return 0 ;; esac
	render_view "upcoming" "${1:-}"
}
# cmd_someday [+Project|@tag|"keyword"] - tasks with no due date
cmd_someday() {
	case "${1:-}" in --help) printf 'usage: headway someday [+Project|@tag|"keyword"]\n'; return 0 ;; esac
	render_view "someday" "${1:-}"
}
# cmd_logbook [+Project|@tag|"keyword"] - completed tasks, most recent first
cmd_logbook() {
	case "${1:-}" in --help) printf 'usage: headway logbook [+Project|@tag|"keyword"]\n'; return 0 ;; esac
	render_view "logbook" "${1:-}"
}
# cmd_projects
# Lists the distinct +Project tokens carried by incomplete tasks, one per
# line, sorted alphabetically.
cmd_projects() {
	case "${1:-}" in --help) printf 'usage: headway projects\n'; return 0 ;; esac
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

# cmd_project +Project              (view: list tasks in a project)
# cmd_project <id> +Project | none  (set: assign or clear a task's project)
#
# Dispatches on the shape of the first argument: `+X` means view, a numeric
# id means set. This replaces the old `cmd_move` (which took the id-shaped
# form under a different name); the set form now sits alongside `tag`,
# `priority`, and `due` in the same <verb> <id> <value> pattern.
cmd_project() {
	_u='usage: headway project +Project              (list tasks in project)
       headway project <id> +Project      (assign task to project)
       headway project <id> none          (clear task'"'"'s project)'
	case "${1:-}" in --help) printf '%s\n' "$_u"; return 0 ;; esac
	[ "$#" -ge 1 ] || usage_die "$_u"

	case "$1" in
	+?*)
		[ "$#" -eq 1 ] || usage_die "$_u"
		render_view "list" "$1"
		return 0
		;;
	esac

	# id-shaped form: <id> <+Project|none>
	[ "$#" -ge 2 ] || usage_die "$_u"
	require_todo_file
	id=$(resolve_id "$1") || exit 1
	value="$2"
	case "$value" in
	none) new_projects="" ;;
	+?*) new_projects="$value" ;;
	*) die "invalid project value: $value (want +Project or 'none')" ;;
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
	case "${1:-}" in --help) printf 'usage: headway archive\n'; return 0 ;; esac
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
	case "${1:-}" in --help) printf 'usage: headway stats\n'; return 0 ;; esac
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
	case "${1:-}" in --help) printf 'usage: headway check\n'; return 0 ;; esac
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

