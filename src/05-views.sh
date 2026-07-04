# ---------------------------------------------------------------------------
# Listing / views
# ---------------------------------------------------------------------------

# collect_task_rows
# Prints one parsed row per non-blank todo.txt line:
# "id<TAB>done<TAB>completion-or--<TAB>projects-or--<TAB>tags-or--<TAB>due-or--<TAB>raw-line".
# The interactive shell keeps this shape cached so read-only commands can
# render without rereading and reparsing TODO_FILE on every prompt.
collect_task_rows() {
	[ -f "$TODO_FILE" ] || return 0
	_ctr_tab=$(printf '\t')
	awk -v tab="$_ctr_tab" '
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
	{
		raw = $0
		if (raw == "") next
		parse(raw)
		print NR tab done tab (compdate == "" ? "-" : compdate) tab \
			(projects == "" ? "-" : projects) tab (tags == "" ? "-" : tags) tab \
			(due == "" ? "-" : due) tab raw
	}
	' "$TODO_FILE"
}

# cached_task_rows_active
# True when cmd_shell has preloaded TODO_FILE into HEADWAY_SHELL_TASK_ROWS.
cached_task_rows_active() {
	[ "${HEADWAY_SHELL_CACHE_ACTIVE:-false}" = "true" ] && [ -n "${HEADWAY_SHELL_TASK_ROWS:-}" ]
}

# filter_task_rows <which> <filter> <today> <today_day> <color_on>
# Converts collect_task_rows output on stdin into collect_view_rows output.
# Also renders `display` (colorized when color_on is "1", verbatim raw
# otherwise) and `hint` (the due-date relative label, e.g. " (today)") in
# this same awk pass, so callers never fork a subshell per row. color_on
# must be resolved by the caller (via use_color) rather than computed here -
# this function is invoked through command substitution, where `[ -t 1 ]`
# would always see the capturing pipe instead of the real terminal.
filter_task_rows() {
	_ftr_which="$1"
	_ftr_filter="${2:-}"
	_ftr_today="$3"
	_ftr_today_day="$4"
	_ftr_color_on="${5:-0}"
	_ftr_tab=$(printf '\t')
	awk -F "$_ftr_tab" -v which="$_ftr_which" -v filter="$_ftr_filter" -v today="$_ftr_today" \
		-v today_day="$_ftr_today_day" -v tab="$_ftr_tab" -v color_on="$_ftr_color_on" \
		-v theme_priority="${THEME_PRIORITY:-}" -v theme_date="${THEME_DATE:-}" -v theme_desc="${THEME_DESC:-}" \
		-v theme_project="${THEME_PROJECT:-}" -v theme_due="${THEME_DUE:-}" -v theme_tag="${THEME_TAG:-}" \
		-v theme_repeat="${THEME_REPEAT:-}" -v theme_done="${THEME_DONE:-}" '
	function raw_line(    i, s) {
		s = $7
		for (i = 8; i <= NF; i++) s = s tab $i
		return s
	}
	function matches_filter(raw, projects, tags) {
		if (filter == "") return 1
		if (substr(filter, 1, 1) == "+" && length(filter) > 1) {
			return index(" " projects " ", " " filter " ") > 0
		}
		if (substr(filter, 1, 1) == "@" && length(filter) > 1) {
			return index(" " tags " ", " " filter " ") > 0
		}
		return index(raw, filter) > 0
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
	{
		id = $1
		raw = raw_line()
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

		if (!matches_filter(raw, projects, tags)) next

		if (which == "today" || which == "upcoming") sortkey = due
		else if (which == "logbook") sortkey = (compdate == "" ? "0000-00-00" : compdate)
		else sortkey = sprintf("%05d", id)

		print sortkey tab id tab (due == "" ? "-" : due) tab build_display(raw) tab due_hint(due) tab raw
	}
	'
}

# filter_grouped_task_rows <today> <today_day> <color_on>
# Converts collect_task_rows output on stdin into collect_grouped_rows output.
# Also renders `display`/`hint` in this same awk pass - see
# collect_grouped_rows for details. color_on must be resolved by the caller
# (via use_color) - see filter_task_rows for why.
filter_grouped_task_rows() {
	_fgtr_today="$1"
	_fgtr_today_day="$2"
	_fgtr_color_on="${3:-0}"
	_fgtr_tab=$(printf '\t')
	awk -F "$_fgtr_tab" -v today="$_fgtr_today" -v today_day="$_fgtr_today_day" -v tab="$_fgtr_tab" \
		-v color_on="$_fgtr_color_on" \
		-v theme_priority="${THEME_PRIORITY:-}" -v theme_date="${THEME_DATE:-}" -v theme_desc="${THEME_DESC:-}" \
		-v theme_project="${THEME_PROJECT:-}" -v theme_due="${THEME_DUE:-}" -v theme_tag="${THEME_TAG:-}" \
		-v theme_repeat="${THEME_REPEAT:-}" -v theme_done="${THEME_DONE:-}" '
	function raw_line(    i, s) {
		s = $7
		for (i = 8; i <= NF; i++) s = s tab $i
		return s
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
	{
		id = $1
		raw = raw_line()
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
}

# collect_view_rows <which> [filter] [color_on]
# Prints one "sortkey<TAB>id<TAB>due-or--<TAB>display<TAB>hint<TAB>raw-line"
# row per matching task. <which> is one of: list, inbox, today, upcoming,
# someday, logbook. `display` is the colorized rendering (verbatim `raw`
# when color is off) and `hint` is the due-date relative label (e.g.
# " (today)") - both computed here, in the same awk pass as the sort key,
# so render_view's per-row loop never forks a subshell. <color_on> must be
# resolved by the caller via use_color: this function always runs through
# command substitution, where `[ -t 1 ]` would only ever see the capturing
# pipe, never the caller's real terminal.
collect_view_rows() {
	_cvr_which="$1"
	_cvr_filter="${2:-}"
	_cvr_color_on="${3:-0}"
	_cvr_today=$(today)
	_cvr_today_day=$(date_to_day_number "$_cvr_today")
	_cvr_tab=$(printf '\t')
	if cached_task_rows_active; then
		printf '%s\n' "$HEADWAY_SHELL_TASK_ROWS" | filter_task_rows "$_cvr_which" "$_cvr_filter" "$_cvr_today" "$_cvr_today_day" "$_cvr_color_on"
		return 0
	fi

	awk -v which="$_cvr_which" -v filter="$_cvr_filter" -v today="$_cvr_today" \
		-v today_day="$_cvr_today_day" -v tab="$_cvr_tab" -v color_on="$_cvr_color_on" \
		-v theme_priority="${THEME_PRIORITY:-}" -v theme_date="${THEME_DATE:-}" -v theme_desc="${THEME_DESC:-}" \
		-v theme_project="${THEME_PROJECT:-}" -v theme_due="${THEME_DUE:-}" -v theme_tag="${THEME_TAG:-}" \
		-v theme_repeat="${THEME_REPEAT:-}" -v theme_done="${THEME_DONE:-}" '
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

		print sortkey tab NR tab (due == "" ? "-" : due) tab build_display(raw) tab due_hint(due) tab raw
	}
	' "$TODO_FILE"
}

# collect_grouped_rows [today] [color_on]
# Prints one
# "bucket<TAB>sortkey<TAB>id<TAB>due-or--<TAB>display<TAB>hint<TAB>raw-line"
# row for every incomplete task, where bucket is ordered as:
#   1 Overdue, 2 Due today, 3 Upcoming, 4 Inbox, 5 Someday.
# `display`/`hint` are computed here (see collect_view_rows) so
# render_grouped_list's per-row loop never forks a subshell. <color_on>
# must be resolved by the caller via use_color - see collect_view_rows for
# why this can't be done internally.
collect_grouped_rows() {
	_cgr_today="${1:-$(today)}"
	_cgr_color_on="${2:-0}"
	_cgr_today_day=$(date_to_day_number "$_cgr_today")
	_cgr_tab=$(printf '\t')
	if cached_task_rows_active; then
		printf '%s\n' "$HEADWAY_SHELL_TASK_ROWS" | filter_grouped_task_rows "$_cgr_today" "$_cgr_today_day" "$_cgr_color_on"
		return 0
	fi

	awk -v today="$_cgr_today" -v today_day="$_cgr_today_day" -v tab="$_cgr_tab" -v color_on="$_cgr_color_on" \
		-v theme_priority="${THEME_PRIORITY:-}" -v theme_date="${THEME_DATE:-}" -v theme_desc="${THEME_DESC:-}" \
		-v theme_project="${THEME_PROJECT:-}" -v theme_due="${THEME_DUE:-}" -v theme_tag="${THEME_TAG:-}" \
		-v theme_repeat="${THEME_REPEAT:-}" -v theme_done="${THEME_DONE:-}" '
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

		print bucket tab sortkey tab NR tab (due == "" ? "-" : due) tab build_display(raw) tab due_hint(due) tab raw
	}
	' "$TODO_FILE"
}

# emit_row <id> <display> <hint>
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

# render_view <which> [filter]
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
	_rgl_color_on=0
	[ "$_rgl_use_color" = "true" ] && _rgl_color_on=1

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
				[ "$_rgl_use_color" = "true" ] && _rgl_h=$(sgr_wrap "$THEME_DATE" "$_rgl_header")
				printf '%s\n' "$_rgl_h"
			fi
			_rgl_current="$_rgl_bucket"
		fi
		[ "$_rgl_hint" = "-" ] && _rgl_hint=""
		emit_row "$_rgl_rid" "$_rgl_display" "$_rgl_hint"
	done
}
