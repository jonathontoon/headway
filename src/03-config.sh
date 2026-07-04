# Precedence (highest wins): environment variables > config file >
# built-in defaults. The config file is a local file the user controls
# (same trust model as ~/.bashrc), so it is dot-sourced directly rather
# than defensively parsed. Because sourcing it runs its assignments
# unconditionally, an already-exported env var is snapshotted beforehand
# and restored afterward - otherwise the file would always win instead
# of the environment.
load_config() {
	config_path="${HEADWAY_CONFIG:-$HOME/.config/headway/config}"

	# Every config variable, each with a matching <name>_DEFAULT in
	# src/00-preamble.sh. The evals below only ever expand these fixed
	# names - no user-controlled text reaches them. THEME_DESC's default
	# is intentionally empty ("" = unstyled); the := still fills it in
	# when unset, it just has nothing visible to set.
	_lc_vars="TODO_FILE DONE_FILE EDITOR COLOR SHOW_IDS CONFIRM_DELETE
		THEME_PRIORITY THEME_PROJECT THEME_TAG THEME_DUE THEME_DATE
		THEME_DESC THEME_REPEAT THEME_DONE"

	for _lc_v in $_lc_vars; do
		eval "_lc_set_$_lc_v=\${$_lc_v+x} _lc_env_$_lc_v=\${$_lc_v-}"
	done

	if [ -f "$config_path" ]; then
		# shellcheck disable=SC1090
		. "$config_path"
	fi

	for _lc_v in $_lc_vars; do
		eval "if [ -n \"\$_lc_set_$_lc_v\" ]; then $_lc_v=\$_lc_env_$_lc_v; fi
			: \"\${$_lc_v:=\$${_lc_v}_DEFAULT}\""
	done

	TODO_FILE=$(expand_tilde "$TODO_FILE")
	DONE_FILE=$(expand_tilde "$DONE_FILE")
}
