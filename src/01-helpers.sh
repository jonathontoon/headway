# ---------------------------------------------------------------------------
# Generic helpers
# ---------------------------------------------------------------------------

err() {
	printf 'headway: %s\n' "$1" >&2
}

die() {
	err "$1"
	exit 1
}

# usage_die <msg>
# Same shape as die() but exits 2 - the POSIX/GNU convention for usage
# errors ("you called headway wrong"), distinct from exit 1 for runtime
# errors ("headway understood you but the request could not be honoured").
# Scripts can branch on the two.
usage_die() {
	err "$1"
	exit 2
}

# headway_commands
# Command names recognized by the interactive shell. Kept in one place so
# typo suggestions and tab completion cannot drift from each other.
headway_commands() {
	printf '%s\n' "add complete undo edit due priority tag clear delete show list inbox today upcoming someday logbook projects project archive stats check help exit"
}

# require_todo_file
# Bails early with a friendly hint when TODO_FILE has never been created.
# Called from id-referencing commands (complete, undo, edit, due, priority,
# tag, clear, delete, show) where the alternative is a raw awk failure from
# resolve_id. Exits 1: the user pointed at a specific task that cannot
# exist in a nonexistent file, so this is a runtime error, not empty state.
require_todo_file() {
	if [ ! -f "$TODO_FILE" ]; then
		err "no tasks yet - try 'headway add \"...\"'"
		exit 1
	fi
}

# suggest_command <bad>
# Prints "did you mean '<X>'?" for the closest known command by edit
# distance, iff a good enough match exists (distance <= 2). Silent when
# nothing is close. Uses awk (POSIX-only features) so it stays inside the
# same portability envelope as the rest of the script.
suggest_command() {
	_sc_bad="$1"
	_sc_known=$(headway_commands)
	_sc_hit=$(printf '%s\n' "$_sc_bad" | awk -v known="$_sc_known" '
	function dist(s, t,    n, m, d, i, j, cost, mn) {
		n = length(s); m = length(t)
		if (n == 0) return m
		if (m == 0) return n
		for (i = 0; i <= n; i++) d[i,0] = i
		for (j = 0; j <= m; j++) d[0,j] = j
		for (i = 1; i <= n; i++) {
			for (j = 1; j <= m; j++) {
				cost = (substr(s,i,1) == substr(t,j,1)) ? 0 : 1
				mn = d[i-1,j] + 1
				if (d[i,j-1] + 1 < mn) mn = d[i,j-1] + 1
				if (d[i-1,j-1] + cost < mn) mn = d[i-1,j-1] + cost
				d[i,j] = mn
			}
		}
		return d[n,m]
	}
	{
		bad = $0
		n = split(known, cmds, " ")
		best = ""; best_score = 3
		for (i = 1; i <= n; i++) {
			s = dist(bad, cmds[i])
			if (s < best_score) { best_score = s; best = cmds[i] }
		}
		if (best != "") print best
	}')
	[ -n "$_sc_hit" ] && err "did you mean '$_sc_hit'?"
	return 0
}

# expand_tilde <value>
# Expands a single leading "~" or "~/..." to $HOME. Needed because a value
# arriving via an environment variable (rather than literally written in a
# sourced shell file) is never tilde-expanded by the shell automatically.
expand_tilde() {
	case "$1" in
	"~")
		printf '%s\n' "$HOME"
		;;
	"~/"*)
		printf '%s\n' "$HOME/${1#\~/}"
		;;
	*)
		printf '%s\n' "$1"
		;;
	esac
}

# use_color
# Returns success (0) if colored output should be used, based on the
# COLOR config value ("auto"/"true"/"false") and whether stdout is a tty.
use_color() {
	case "${COLOR:-auto}" in
	true) return 0 ;;
	false) return 1 ;;
	*) [ -t 1 ] ;;
	esac
}

# use_color_err
# Same as use_color(), but for output written to stderr (fd 2) - stdout
# and stderr can be redirected independently, so each needs its own tty
# check when COLOR=auto.
use_color_err() {
	case "${COLOR:-auto}" in
	true) return 0 ;;
	false) return 1 ;;
	*) [ -t 2 ] ;;
	esac
}

# safe_write <target-file>
# Reads the desired full file content from stdin and atomically replaces
# <target-file> with it. Never uses `sed -i` (GNU/BSD flag incompatibility);
# always writes to a fresh tempfile in the same directory as the target
# (so `mv` stays on one filesystem and is atomic) then moves it into place.
safe_write() {
	target="$1"
	tmp=$(mktemp "${target}.XXXXXX") || die "mktemp failed for $target"
	if ! cat >"$tmp"; then
		rm -f "$tmp"
		die "failed writing to tempfile for $target"
	fi
	if ! mv "$tmp" "$target"; then
		rm -f "$tmp"
		die "failed to replace $target"
	fi
}
