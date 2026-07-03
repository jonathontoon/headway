# ---------------------------------------------------------------------------
# Config loading
# ---------------------------------------------------------------------------

# load_config
# Precedence (highest wins): environment variables > config file >
# built-in defaults. The config file is a local file the user controls
# (same trust model as ~/.bashrc), so it is dot-sourced directly rather
# than defensively parsed. Because sourcing it runs its assignments
# unconditionally, an already-exported env var is snapshotted beforehand
# and restored afterward - otherwise the file would always win instead
# of the environment.
load_config() {
	config_path="${HEADWAY_CONFIG:-$HOME/.config/headway/config}"

	_lc_had_todo=${TODO_FILE+x}
	_lc_env_todo=${TODO_FILE-}
	_lc_had_done=${DONE_FILE+x}
	_lc_env_done=${DONE_FILE-}
	_lc_had_editor=${EDITOR+x}
	_lc_env_editor=${EDITOR-}
	_lc_had_color=${COLOR+x}
	_lc_env_color=${COLOR-}
	_lc_had_ids=${SHOW_IDS+x}
	_lc_env_ids=${SHOW_IDS-}
	_lc_had_conf=${CONFIRM_DELETE+x}
	_lc_env_conf=${CONFIRM_DELETE-}
	_lc_had_tpri=${THEME_PRIORITY+x}
	_lc_env_tpri=${THEME_PRIORITY-}
	_lc_had_tproj=${THEME_PROJECT+x}
	_lc_env_tproj=${THEME_PROJECT-}
	_lc_had_ttag=${THEME_TAG+x}
	_lc_env_ttag=${THEME_TAG-}
	_lc_had_tdue=${THEME_DUE+x}
	_lc_env_tdue=${THEME_DUE-}
	_lc_had_tdate=${THEME_DATE+x}
	_lc_env_tdate=${THEME_DATE-}
	_lc_had_tdesc=${THEME_DESC+x}
	_lc_env_tdesc=${THEME_DESC-}
	_lc_had_trep=${THEME_REPEAT+x}
	_lc_env_trep=${THEME_REPEAT-}
	_lc_had_tdone=${THEME_DONE+x}
	_lc_env_tdone=${THEME_DONE-}

	if [ -f "$config_path" ]; then
		# shellcheck disable=SC1090
		. "$config_path"
	fi

	if [ -n "$_lc_had_todo" ]; then TODO_FILE="$_lc_env_todo"; fi
	if [ -n "$_lc_had_done" ]; then DONE_FILE="$_lc_env_done"; fi
	if [ -n "$_lc_had_editor" ]; then EDITOR="$_lc_env_editor"; fi
	if [ -n "$_lc_had_color" ]; then COLOR="$_lc_env_color"; fi
	if [ -n "$_lc_had_ids" ]; then SHOW_IDS="$_lc_env_ids"; fi
	if [ -n "$_lc_had_conf" ]; then CONFIRM_DELETE="$_lc_env_conf"; fi
	if [ -n "$_lc_had_tpri" ]; then THEME_PRIORITY="$_lc_env_tpri"; fi
	if [ -n "$_lc_had_tproj" ]; then THEME_PROJECT="$_lc_env_tproj"; fi
	if [ -n "$_lc_had_ttag" ]; then THEME_TAG="$_lc_env_ttag"; fi
	if [ -n "$_lc_had_tdue" ]; then THEME_DUE="$_lc_env_tdue"; fi
	if [ -n "$_lc_had_tdate" ]; then THEME_DATE="$_lc_env_tdate"; fi
	if [ -n "$_lc_had_tdesc" ]; then THEME_DESC="$_lc_env_tdesc"; fi
	if [ -n "$_lc_had_trep" ]; then THEME_REPEAT="$_lc_env_trep"; fi
	if [ -n "$_lc_had_tdone" ]; then THEME_DONE="$_lc_env_tdone"; fi

	: "${TODO_FILE:=$TODO_FILE_DEFAULT}"
	: "${DONE_FILE:=$DONE_FILE_DEFAULT}"
	: "${EDITOR:=$EDITOR_DEFAULT}"
	: "${COLOR:=$COLOR_DEFAULT}"
	: "${SHOW_IDS:=$SHOW_IDS_DEFAULT}"
	: "${CONFIRM_DELETE:=$CONFIRM_DELETE_DEFAULT}"
	# THEME_DESC's default is intentionally empty ("" = unstyled) - this
	# still fills it in when unset, it just has nothing visible to set.
	: "${THEME_PRIORITY:=$THEME_PRIORITY_DEFAULT}"
	: "${THEME_PROJECT:=$THEME_PROJECT_DEFAULT}"
	: "${THEME_TAG:=$THEME_TAG_DEFAULT}"
	: "${THEME_DUE:=$THEME_DUE_DEFAULT}"
	: "${THEME_DATE:=$THEME_DATE_DEFAULT}"
	: "${THEME_DESC:=$THEME_DESC_DEFAULT}"
	: "${THEME_REPEAT:=$THEME_REPEAT_DEFAULT}"
	: "${THEME_DONE:=$THEME_DONE_DEFAULT}"

	TODO_FILE=$(expand_tilde "$TODO_FILE")
	DONE_FILE=$(expand_tilde "$DONE_FILE")
}
