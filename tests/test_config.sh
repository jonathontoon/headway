#!/bin/sh
# Tests for load_config precedence (env > config file > built-in default)
# and tilde expansion.

set -eu

cd "$(dirname "$0")/.."
. tests/helpers.sh
setup_sandbox

HEADWAY_LIB_ONLY=true
. ./headway.sh
detect_date_flavor

conf_dir="$SANDBOX/conf"
mkdir -p "$conf_dir"

# --- expand_tilde: both branches + non-tilde passthrough --------------------

assert_eq "$HOME" "$(expand_tilde '~')" "expand_tilde: bare ~"
assert_eq "$HOME/foo/bar" "$(expand_tilde '~/foo/bar')" "expand_tilde: ~/path"
assert_eq "/already/absolute" "$(expand_tilde '/already/absolute')" "expand_tilde: absolute passthrough"
assert_eq "relative/path" "$(expand_tilde 'relative/path')" "expand_tilde: relative passthrough"

# --- built-in default when neither env nor file set TODO_FILE --------------

result=$(
	unset TODO_FILE DONE_FILE EDITOR COLOR DATE_FORMAT SHOW_IDS AUTO_ARCHIVE CONFIRM_DELETE
	HEADWAY_CONFIG="$SANDBOX/no-such-config"
	load_config
	printf '%s\n' "$TODO_FILE"
)
assert_eq "$HOME/todo.txt" "$result" "config: built-in default when no env and no file"

# --- config file value applies, and is tilde-expanded ----------------------

cat >"$conf_dir/config1" <<'EOF'
TODO_FILE=~/headway-test-configured/todo.txt
EOF

result=$(
	unset TODO_FILE DONE_FILE
	HEADWAY_CONFIG="$conf_dir/config1"
	load_config
	printf '%s\n' "$TODO_FILE"
)
assert_eq "$HOME/headway-test-configured/todo.txt" "$result" "config: file value applied and tilde-expanded"

# --- env var wins over a conflicting config file value ----------------------

cat >"$conf_dir/config2" <<'EOF'
TODO_FILE=~/should-be-ignored/todo.txt
EOF

result=$(
	TODO_FILE="$SANDBOX/env-todo.txt"
	HEADWAY_CONFIG="$conf_dir/config2"
	load_config
	printf '%s\n' "$TODO_FILE"
)
assert_eq "$SANDBOX/env-todo.txt" "$result" "config: env var wins over config file"

# --- same precedence holds for a non-path setting (CONFIRM_DELETE) ----------

cat >"$conf_dir/config3" <<'EOF'
CONFIRM_DELETE=true
EOF

result=$(
	CONFIRM_DELETE=false
	HEADWAY_CONFIG="$conf_dir/config3"
	load_config
	printf '%s\n' "$CONFIRM_DELETE"
)
assert_eq "false" "$result" "config: env CONFIRM_DELETE wins over config file"

result=$(
	unset CONFIRM_DELETE
	HEADWAY_CONFIG="$conf_dir/config3"
	load_config
	printf '%s\n' "$CONFIRM_DELETE"
)
assert_eq "true" "$result" "config: file value wins over built-in default"

result=$(
	unset CONFIRM_DELETE
	HEADWAY_CONFIG="$SANDBOX/no-such-config"
	load_config
	printf '%s\n' "$CONFIRM_DELETE"
)
assert_eq "true" "$result" "config: built-in default when no env and no file"

teardown_sandbox
report_and_exit
