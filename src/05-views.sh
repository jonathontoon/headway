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
			[ -z "$P_DUE" ] || continue
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
			[ -n "$P_PROJECTS" ] || continue
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

# emit_row <id> <raw-line> <use-color>
# Formats a single task row for display: applies colorize_line when
# use-color is "true", parses the raw line to pull P_DUE for a relative
# hint (via format_due_hint), and honors SHOW_IDS. Shared by render_view
# and render_grouped_view so the two never drift.
emit_row() {
	_er_id="$1"
	_er_raw="$2"
	_er_use_color="$3"

	if [ "$_er_use_color" = "true" ]; then
		_er_display=$(colorize_line "$_er_raw")
	else
		_er_display="$_er_raw"
	fi

	parse_line "$_er_raw"
	_er_hint=""
	if [ -n "$P_DUE" ]; then
		_er_h=$(format_due_hint "$P_DUE")
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
		emit_row "$_rv_id" "$_rv_line" "$_rv_use_color"
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
	_rgl_tab=$(printf '\t')
	_rgl_use_color=false
	use_color && _rgl_use_color=true

	_rgl_od=$(mktemp) || die "mktemp failed"
	_rgl_td=$(mktemp) || { rm -f "$_rgl_od"; die "mktemp failed"; }
	_rgl_up=$(mktemp) || { rm -f "$_rgl_od" "$_rgl_td"; die "mktemp failed"; }
	_rgl_sd=$(mktemp) || { rm -f "$_rgl_od" "$_rgl_td" "$_rgl_up"; die "mktemp failed"; }
	_rgl_ib=$(mktemp) || { rm -f "$_rgl_od" "$_rgl_td" "$_rgl_up" "$_rgl_sd"; die "mktemp failed"; }

	_rgl_id=0
	while IFS= read -r _rgl_raw || [ -n "$_rgl_raw" ]; do
		_rgl_id=$((_rgl_id + 1))
		[ -n "$_rgl_raw" ] || continue
		parse_line "$_rgl_raw"
		[ "$P_DONE" = "false" ] || continue

		if [ -z "$P_DUE" ]; then
			if [ -z "$P_PROJECTS" ]; then
				_rgl_bucket=$_rgl_ib
			else
				_rgl_bucket=$_rgl_sd
			fi
			_rgl_key=$(printf '%05d' "$_rgl_id")
		elif expr "$P_DUE" '<' "$_rgl_today" >/dev/null; then
			_rgl_bucket=$_rgl_od
			_rgl_key="$P_DUE"
		elif [ "$P_DUE" = "$_rgl_today" ]; then
			_rgl_bucket=$_rgl_td
			_rgl_key="$P_DUE"
		else
			_rgl_bucket=$_rgl_up
			_rgl_key="$P_DUE"
		fi
		printf '%s\t%s\t%s\n' "$_rgl_key" "$_rgl_id" "$_rgl_raw" >>"$_rgl_bucket"
	done <"$TODO_FILE"

	_rgl_populated=0
	for _rgl_f in "$_rgl_od" "$_rgl_td" "$_rgl_up" "$_rgl_ib" "$_rgl_sd"; do
		[ -s "$_rgl_f" ] && _rgl_populated=$((_rgl_populated + 1))
	done
	_rgl_show_headers=false
	[ "$_rgl_populated" -ge 2 ] && _rgl_show_headers=true

	_rgl_first=true
	for _rgl_pair in "Overdue|$_rgl_od" "Due today|$_rgl_td" "Upcoming|$_rgl_up" "Inbox|$_rgl_ib" "Someday|$_rgl_sd"; do
		_rgl_header="${_rgl_pair%%|*}"
		_rgl_file="${_rgl_pair#*|}"
		[ -s "$_rgl_file" ] || continue

		if [ "$_rgl_show_headers" = "true" ]; then
			[ "$_rgl_first" = "false" ] && printf '\n'
			_rgl_h="$_rgl_header"
			[ "$_rgl_use_color" = "true" ] && _rgl_h=$(sgr_wrap "$THEME_DATE" "$_rgl_header")
			printf '%s\n' "$_rgl_h"
		fi
		_rgl_first=false

		sort -t "$_rgl_tab" -k1,1 "$_rgl_file" | while IFS="$_rgl_tab" read -r _ _rgl_rid _rgl_rline; do
			emit_row "$_rgl_rid" "$_rgl_rline" "$_rgl_use_color"
		done
	done

	rm -f "$_rgl_od" "$_rgl_td" "$_rgl_up" "$_rgl_ib" "$_rgl_sd"
}
