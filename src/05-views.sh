# Prints one "id<TAB>raw-line" row per non-blank todo.txt line, where id is
# the 1-indexed line number (blank lines still advance it, matching
# resolve_id). The interactive shell keeps this output cached so read-only
# commands can render without rereading TODO_FILE on every prompt.
collect_task_rows() {
	[ -f "$TODO_FILE" ] || return 0
	awk -v tab="$(printf '\t')" '$0 != "" { print NR tab $0 }' "$TODO_FILE"
}

cached_task_rows_active() {
	[ "${HEADWAY_SHELL_CACHE_ACTIVE:-false}" = "true" ] && [ -n "${HEADWAY_SHELL_TASK_ROWS:-}" ]
}

# The awk function library shared by every view-rendering pass. Injected by
# string concatenation ahead of a per-view main block (awk_view_pass), so the
# tokenizer, colorizer, and due-hint logic exist exactly once. All functions
# read the -v globals awk_view_pass sets (src, tab, filter, today, today_day,
# color_on, theme_*).
#
# input_row() abstracts the two input shapes: src="file" reads raw todo.txt
# lines (id = NR, blank lines skipped), src="rows" reads collect_task_rows
# output from stdin (id = $1, raw = the rest, re-joined in case the task text
# itself contains tabs). Returns 0 when the record should be skipped.
# shellcheck disable=SC2016 # awk program text - $ must reach awk unexpanded
HW_AWK_VIEWLIB='
function input_row(    i) {
	if (src == "file") {
		if ($0 == "") return 0
		id = NR
		raw = $0
	} else {
		id = $1
		raw = $2
		for (i = 3; i <= NF; i++) raw = raw tab $i
	}
	return 1
}
function parse(raw,    rest, toks, n, i, t) {
	done = "false"; compdate = ""; pri = ""; credate = ""; desc = ""
	projects = ""; tags = ""; due = ""; repeat = ""; prival = ""
	rest = raw

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
	} else if (match(rest, /^[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9] /)) {
		credate = substr(rest, 1, 10)
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
		} else if (substr(t, 1, 7) == "repeat:") {
			repeat = substr(t, 8)
		} else if (substr(t, 1, 4) == "pri:") {
			prival = substr(t, 5)
		} else {
			desc = (desc == "" ? t : desc " " t)
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
function sgr(code, text) {
	if (code != "") return "\033[" code "m" text "\033[0m"
	return text
}
function wrap_tokens(toks_str, code,    toks, n, i, out) {
	if (toks_str == "") return ""
	n = split(toks_str, toks, " ")
	out = ""
	for (i = 1; i <= n; i++) out = (out == "" ? sgr(code, toks[i]) : out " " sgr(code, toks[i]))
	return out
}
function build_display(raw_text,    out, w) {
	if (!color_on) return raw_text
	if (done == "true") {
		out = "x"
		if (compdate != "") out = out " " compdate
		if (credate != "") out = out " " credate
		if (desc != "") out = out " " desc
		if (projects != "") out = out " " projects
		if (due != "") out = out " due:" due
		if (tags != "") out = out " " tags
		if (repeat != "") out = out " repeat:" repeat
		if (prival != "") out = out " pri:" prival
		return sgr(theme_done, out)
	}
	out = ""
	if (pri != "") out = sgr(theme_priority, "(" pri ")")
	if (credate != "") out = (out == "" ? sgr(theme_date, credate) : out " " sgr(theme_date, credate))
	if (desc != "") out = (out == "" ? sgr(theme_desc, desc) : out " " sgr(theme_desc, desc))
	if (projects != "") { w = wrap_tokens(projects, theme_project); out = (out == "" ? w : out " " w) }
	if (due != "") { w = sgr(theme_due, "due:" due); out = (out == "" ? w : out " " w) }
	if (tags != "") { w = wrap_tokens(tags, theme_tag); out = (out == "" ? w : out " " w) }
	if (repeat != "") { w = sgr(theme_repeat, "repeat:" repeat); out = (out == "" ? w : out " " w) }
	return out
}
function day_number(datestr,    y, m, d, era, yoe, mp, doy, doe) {
	y = substr(datestr, 1, 4) + 0
	m = substr(datestr, 6, 2) + 0
	d = substr(datestr, 9, 2) + 0
	if (m <= 2) y -= 1
	era = int(y / 400)
	yoe = y - era * 400
	if (m > 2) mp = m - 3; else mp = m + 9
	doy = int((153 * mp + 2) / 5) + d - 1
	doe = yoe * 365 + int(yoe / 4) - int(yoe / 100) + doy
	return era * 146097 + doe - 719468
}
function weekday_name(day_num,    idx, names) {
	idx = (day_num + 4) % 7
	split("sunday monday tuesday wednesday thursday friday saturday", names, " ")
	return names[idx + 1]
}
function due_hint_label(due_date,    due_day, delta) {
	if (due_date == "") return ""
	if (due_date == today) return "today"
	due_day = day_number(due_date)
	delta = due_day - today_day
	if (delta == -1) return "yesterday"
	if (delta == 1) return "tomorrow"
	if (delta >= 2 && delta <= 7) return weekday_name(due_day)
	return ""
}
function due_hint(due_date,    label) {
	label = due_hint_label(due_date)
	if (label == "") return "-"
	if (color_on) return " " sgr(theme_date, "(" label ")")
	return " (" label ")"
}
'

# Main block for flat views (list/inbox/today/upcoming/someday/logbook):
# selects rows by <which>, applies the filter, and prints
# "sortkey<TAB>id<TAB>due-or--<TAB>display<TAB>hint<TAB>raw-line".
HW_AWK_VIEW_MAIN='
{
	if (!input_row()) next
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
	else sortkey = sprintf("%05d", id)

	print sortkey tab id tab (due == "" ? "-" : due) tab build_display(raw) tab due_hint(due) tab raw
}
'

# Main block for the grouped list: buckets every incomplete task
# (1 Overdue, 2 Due today, 3 Upcoming, 4 Inbox, 5 Someday) and prints
# "bucket<TAB>sortkey<TAB>id<TAB>due-or--<TAB>display<TAB>hint<TAB>raw-line".
HW_AWK_GROUPED_MAIN='
{
	if (!input_row()) next
	parse(raw)
	if (done != "false") next

	if (due == "") {
		bucket = (projects == "" ? 4 : 5)
		sortkey = sprintf("%05d", id)
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

	print bucket tab sortkey tab id tab (due == "" ? "-" : due) tab build_display(raw) tab due_hint(due) tab raw
}
'

# Runs one awk pass composed of HW_AWK_VIEWLIB plus <main>. <src> is "rows"
# (collect_task_rows output arrives on stdin) or "file" (raw todo.txt lines
# are read from [file]) - either way it is a single process, so the shell
# cache path and the one-shot path cost the same. <color_on> must be
# resolved by the caller via use_color: this always runs through command
# substitution, where `[ -t 1 ]` would only ever see the capturing pipe,
# never the caller's real terminal.
awk_view_pass() {
	_avp_tab=$(printf '\t')
	awk -F "$_avp_tab" -v src="$2" -v which="$3" -v filter="$4" \
		-v today="$5" -v today_day="$6" -v color_on="$7" -v tab="$_avp_tab" \
		-v theme_priority="${THEME_PRIORITY:-}" -v theme_date="${THEME_DATE:-}" \
		-v theme_desc="${THEME_DESC:-}" -v theme_project="${THEME_PROJECT:-}" \
		-v theme_due="${THEME_DUE:-}" -v theme_tag="${THEME_TAG:-}" \
		-v theme_repeat="${THEME_REPEAT:-}" -v theme_done="${THEME_DONE:-}" \
		"$HW_AWK_VIEWLIB$1" ${8:+"$8"}
}

# Prints one "sortkey<TAB>id<TAB>due-or--<TAB>display<TAB>hint<TAB>raw-line"
# row per matching task. <which> is one of: list, inbox, today, upcoming,
# someday, logbook. `display` is the colorized rendering (verbatim `raw`
# when color is off) and `hint` is the due-date relative label (e.g.
# " (today)") - both computed in the same awk pass as the sort key, so
# render_view's per-row loop never forks a subshell.
collect_view_rows() {
	_cvr_which="$1"
	_cvr_filter="${2:-}"
	_cvr_color_on="${3:-0}"
	_cvr_today=$(today)
	_cvr_today_day=$(date_to_day_number "$_cvr_today")
	if cached_task_rows_active; then
		printf '%s\n' "$HEADWAY_SHELL_TASK_ROWS" |
			awk_view_pass "$HW_AWK_VIEW_MAIN" rows "$_cvr_which" "$_cvr_filter" \
				"$_cvr_today" "$_cvr_today_day" "$_cvr_color_on"
	else
		awk_view_pass "$HW_AWK_VIEW_MAIN" file "$_cvr_which" "$_cvr_filter" \
			"$_cvr_today" "$_cvr_today_day" "$_cvr_color_on" "$TODO_FILE"
	fi
}

# Prints one
# "bucket<TAB>sortkey<TAB>id<TAB>due-or--<TAB>display<TAB>hint<TAB>raw-line"
# row for every incomplete task - see HW_AWK_GROUPED_MAIN for the bucket
# order and collect_view_rows for the display/hint contract.
collect_grouped_rows() {
	_cgr_today="${1:-$(today)}"
	_cgr_color_on="${2:-0}"
	_cgr_today_day=$(date_to_day_number "$_cgr_today")
	if cached_task_rows_active; then
		printf '%s\n' "$HEADWAY_SHELL_TASK_ROWS" |
			awk_view_pass "$HW_AWK_GROUPED_MAIN" rows "" "" \
				"$_cgr_today" "$_cgr_today_day" "$_cgr_color_on"
	else
		awk_view_pass "$HW_AWK_GROUPED_MAIN" file "" "" \
			"$_cgr_today" "$_cgr_today_day" "$_cgr_color_on" "$TODO_FILE"
	fi
}

# Prints "<id>: <display><hint>" (or just "<display><hint>" when
# SHOW_IDS=false). <display> and <hint> arrive already fully rendered
# (colorized when applicable) from collect_view_rows/collect_grouped_rows -
# this function does no computation of its own, just formatting. Shared by
# render_view and render_grouped_list so the two never drift.
emit_row() {
	_er_id="$1"
	_er_display="$2"
	_er_hint="$3"

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

# Prints "<id>: <line>" for each task in view <which>, sorted ascending by
# sortkey (today/upcoming: due date; logbook: completion date, descending;
# everything else: file order).
render_view() {
	_rv_which="$1"
	_rv_filter="${2:-}"
	[ -f "$TODO_FILE" ] || return 0

	_rv_color_on=0
	use_color && _rv_color_on=1

	_rv_rows=$(collect_view_rows "$_rv_which" "$_rv_filter" "$_rv_color_on")
	[ -n "$_rv_rows" ] || return 0

	_rv_tab=$(printf '\t')
	case "$_rv_which" in
	logbook) _rv_sorted=$(printf '%s\n' "$_rv_rows" | sort -t "$_rv_tab" -k1,1 -r) ;;
	*) _rv_sorted=$(printf '%s\n' "$_rv_rows" | sort -t "$_rv_tab" -k1,1) ;;
	esac

	printf '%s\n' "$_rv_sorted" | while IFS="$_rv_tab" read -r _ _rv_id _ _rv_display _rv_hint _rv_raw; do
		[ "$_rv_hint" = "-" ] && _rv_hint=""
		emit_row "$_rv_id" "$_rv_display" "$_rv_hint"
	done
}

# Emits every incomplete task, bucketed into Overdue / Due today /
# Upcoming / Inbox / Someday sections. Section headers appear only when at least
# two buckets have content - a list that happens to be all-inbox,
# all-someday, or all-overdue still prints flat, unadorned, matching the
# pre-grouping behaviour so it doesn't feel over-decorated for the common case.
render_grouped_list() {
	[ -f "$TODO_FILE" ] || return 0

	_rgl_today=$(today)
	_rgl_tab=$(printf '\t')
	_rgl_color_on=0
	use_color && _rgl_color_on=1

	_rgl_rows=$(collect_grouped_rows "$_rgl_today" "$_rgl_color_on")
	[ -n "$_rgl_rows" ] || return 0
	_rgl_sorted=$(printf '%s\n' "$_rgl_rows" | sort -t "$_rgl_tab" -k1,1n -k2,2)
	_rgl_populated=$(printf '%s\n' "$_rgl_sorted" | awk -F "$_rgl_tab" 'NF && !seen[$1]++ { n++ } END { print n + 0 }')
	_rgl_show_headers=false
	[ "$_rgl_populated" -ge 2 ] && _rgl_show_headers=true

	_rgl_current=""
	printf '%s\n' "$_rgl_sorted" | while IFS="$_rgl_tab" read -r _rgl_bucket _ _rgl_rid _ _rgl_display _rgl_hint _rgl_rline; do
		[ -n "$_rgl_bucket" ] || continue
		if [ "$_rgl_bucket" != "$_rgl_current" ]; then
			_rgl_header=$(bucket_header "$_rgl_bucket")
			if [ "$_rgl_show_headers" = "true" ]; then
				[ -n "$_rgl_current" ] && printf '\n'
				_rgl_h="$_rgl_header"
				[ "$_rgl_color_on" -eq 1 ] && _rgl_h=$(sgr_wrap "$THEME_DATE" "$_rgl_header")
				printf '%s\n' "$_rgl_h"
			fi
			_rgl_current="$_rgl_bucket"
		fi
		[ "$_rgl_hint" = "-" ] && _rgl_hint=""
		emit_row "$_rgl_rid" "$_rgl_display" "$_rgl_hint"
	done
}
