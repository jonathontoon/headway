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
	elif date -u -d "@0" "+%Y-%m-%d" >/dev/null 2>&1; then
		DATE_FLAVOR="busybox"
	else
		die "unsupported date(1) implementation: cannot detect GNU, BSD, or BusyBox flavor"
	fi
}

# today
# Prints today's date as YYYY-MM-DD. Flavor-independent: both GNU and BSD
# date support a bare `+FORMAT` invocation with no other arguments.
today() {
	date "+%Y-%m-%d"
}

# greeting
# Prints "Good morning"/"Good afternoon"/"Good evening" based on the local
# hour. Flavor-independent, same as today().
greeting() {
	hour=$(date "+%H")
	if [ "$hour" -lt 12 ]; then
		printf 'Good morning'
	elif [ "$hour" -lt 18 ]; then
		printf 'Good afternoon'
	else
		printf 'Good evening'
	fi
}

# date_weekday_name <YYYY-MM-DD>
# Prints the lowercase full weekday name (e.g. "monday", "sunday") for the
# given date. Flavor-specific because BSD `date` cannot parse a bare
# YYYY-MM-DD with `-d`, and BusyBox `date` needs the -u/-d combination.
date_weekday_name() {
	case "$DATE_FLAVOR" in
	gnu) date -d "$1" "+%A" | tr 'A-Z' 'a-z' ;;
	bsd) date -j -f "%Y-%m-%d" "$1" "+%A" | tr 'A-Z' 'a-z' ;;
	busybox) date -u -d "$1" "+%A" | tr 'A-Z' 'a-z' ;;
	esac
}

# format_due_hint <YYYY-MM-DD>
# Emits a short relative label for a due date compared to today. Returns:
#   "yesterday"           for due == today - 1
#   "today"               for due == today
#   "tomorrow"            for due == today + 1
#   "monday".."sunday"    for due in today+2..today+7 (the next occurrence
#                         of that weekday; when today's own weekday name
#                         would apply it points seven days out, never at
#                         today - "today" already covers same-day)
# Anything else: prints nothing.
#
# Display-only. Callers wrap the returned label in parens after due:DATE;
# the raw todo.txt is never touched.
format_due_hint() {
	_fdh_date="$1"
	_fdh_today=$(today)
	if [ "$_fdh_date" = "$_fdh_today" ]; then
		printf 'today\n'
		return 0
	fi
	if [ "$_fdh_date" = "$(date_add_days "$_fdh_today" -1)" ]; then
		printf 'yesterday\n'
		return 0
	fi
	if [ "$_fdh_date" = "$(date_add_days "$_fdh_today" 1)" ]; then
		printf 'tomorrow\n'
		return 0
	fi
	_fdh_i=2
	while [ "$_fdh_i" -le 7 ]; do
		if [ "$_fdh_date" = "$(date_add_days "$_fdh_today" "$_fdh_i")" ]; then
			date_weekday_name "$_fdh_date"
			return 0
		fi
		_fdh_i=$((_fdh_i + 1))
	done
}

# bsd_signed_offset <offset>
# Prepends `+` to an unsigned offset so BSD `date -v` reads it as a delta
# rather than an absolute-field set (`-v1d` sets day-of-month to 1;
# `-v+1d` adds one day). Passes explicitly-signed offsets through
# unchanged.
bsd_signed_offset() {
	case "$1" in
	-* | +*) printf '%s\n' "$1" ;;
	*) printf '+%s\n' "$1" ;;
	esac
}

# date_add_days <YYYY-MM-DD> <signed-offset>
date_add_days() {
	base="$1"
	offset="$2"
	case "$DATE_FLAVOR" in
	gnu) date -d "$base + $offset day" "+%Y-%m-%d" ;;
	bsd)
		_dad_o=$(bsd_signed_offset "$offset")
		date -j -v"${_dad_o}"d -f "%Y-%m-%d" "$base" "+%Y-%m-%d"
		;;
	busybox)
		_dad_epoch=$(date -u -d "$base" "+%s") || die "invalid date: $base"
		_dad_epoch=$((_dad_epoch + offset * 86400))
		date -u -d "@$_dad_epoch" "+%Y-%m-%d"
		;;
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
	bsd)
		_dam_o=$(bsd_signed_offset "$offset")
		date -j -v"${_dam_o}"m -f "%Y-%m-%d" "$base" "+%Y-%m-%d"
		;;
	busybox)
		_dam_y=${base%%-*}
		_dam_rest=${base#*-}
		_dam_m=${_dam_rest%%-*}
		_dam_d=${_dam_rest#*-}
		_dam_y=${_dam_y#0}
		_dam_m=${_dam_m#0}
		_dam_total=$(((_dam_y * 12 + (_dam_m - 1)) + offset))
		_dam_nm0=$((_dam_total % 12))
		_dam_ny=$((_dam_total / 12))
		if [ "$_dam_nm0" -lt 0 ]; then
			_dam_nm0=$((_dam_nm0 + 12))
			_dam_ny=$((_dam_ny - 1))
		fi
		_dam_nm=$((_dam_nm0 + 1))
		date -u -d "$(printf '%04d-%02d-%02d' "$_dam_ny" "$_dam_nm" "${_dam_d#0}")" "+%Y-%m-%d"
		;;
	esac
}

# date_add_years <YYYY-MM-DD> <signed-offset>
date_add_years() {
	base="$1"
	offset="$2"
	case "$DATE_FLAVOR" in
	gnu) date -d "$base + $offset year" "+%Y-%m-%d" ;;
	bsd)
		_day_o=$(bsd_signed_offset "$offset")
		date -j -v"${_day_o}"y -f "%Y-%m-%d" "$base" "+%Y-%m-%d"
		;;
	busybox)
		_day_y=${base%%-*}
		_day_rest=${base#*-}
		_day_m=${_day_rest%%-*}
		_day_d=${_day_rest#*-}
		_day_ny=$((${_day_y#0} + offset))
		date -u -d "$(printf '%04d-%02d-%02d' "$_day_ny" "${_day_m#0}" "${_day_d#0}")" "+%Y-%m-%d"
		;;
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
	busybox) date -u -d "$1" >/dev/null 2>&1 ;;
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

