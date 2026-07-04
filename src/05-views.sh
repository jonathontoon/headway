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
