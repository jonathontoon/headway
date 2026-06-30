# Add an internal sourced-plugin framework to headway

## Context

`headway` (`hw`) is a complete, tested POSIX-sh todo.txt CLI on `develop`. This document captures a discovery/design pass for adding a plugin framework. Discovery surfaced a real conflict: `README.md` (lines 126-130) currently states **"No plugin system"** as a v0 non-goal, committing instead to an external-executable add-on model. Given a choice between that external model and a more powerful internal model, the decision was: **plugins are `.sh` files dot-sourced directly into the live `hw` process**, with full read/write access to every internal global and helper function (`parse_line`, `format_line`, `resolve_id`, `replace_line_at`, `render_view`, etc.) — the same trust model `headway` already uses for its config file. This requires retracting the README's existing non-goal.

The trickiest shell constructs below were empirically verified against a real `dash` binary, not just reasoned about. Two real bugs were caught and avoided during that verification:
- A "probe-in-a-subshell-then-source-for-real" fault-isolation scheme double-executes every plugin's top-level side effects — confirmed by observing a log line written twice. Rejected.
- Building the plugin registry's row separator via `$(printf '\n')` silently strips the trailing newline (command substitution behavior), corrupting the registry. Fixed by embedding a literal newline directly in the assignment instead.

**Status: design only, not implemented.**

## Design

### 1. Discovery & loading

New constant near the other `*_DEFAULT`s (~headway.sh:16-23):
```sh
PLUGIN_DIR_DEFAULT="$HOME/.config/headway/plugins"
```

New `load_plugins()`, placed in a new `# --- Plugins ---` section between `render_view` (~line 496) and the `# --- Usage ---` header (~line 498):
```sh
load_plugins() {
	_lp_dir="${HEADWAY_PLUGIN_DIR:-$PLUGIN_DIR_DEFAULT}"
	_lp_dir=$(expand_tilde "$_lp_dir")
	[ -d "$_lp_dir" ] || return 0

	for _lp_file in "$_lp_dir"/*.sh; do
		[ -e "$_lp_file" ] || continue
		PLUGIN_LOADING_FILE="$_lp_file"
		if ! . "$_lp_file"; then
			die "failed to load plugin: $_lp_file"
		fi
	done
	PLUGIN_LOADING_FILE=""
}
```
- `[ -e "$_lp_file" ] || continue` is the exact nullglob-safe guard already used in `tests/run.sh:15` — proven under this project's own CI.
- `PLUGIN_LOADING_FILE` is an ambient global (same pattern as `parse_line`'s `P_*`) so `register_plugin` can attribute a registration to its source file without the plugin author passing it explicitly.
- A plugin's `false`/`die` failure is caught by `if ! . "$_lp_file"` and reported via `die "failed to load plugin: ..."`. A command-not-found typo inside a plugin is **not** caught by this `if` under dash — dash hard-aborts with its own exit 127 first. Verified empirically; documented as an accepted limitation rather than worked around (a workaround would require running plugins out-of-process, defeating the entire point of shared-process access).
- **Decision: a broken plugin aborts the whole `hw` invocation.** No POSIX-sh-safe alternative exists — there's no `declare -f` to serialize a function out of a probe subshell, and the probe-then-source approach double-executes side effects (verified). This matches the existing precedent: a broken `~/.config/headway/config` already takes down `hw` today with zero isolation.

`main()` gets one new line, after `detect_date_flavor` and before the dispatch `case` (~headway.sh:966):
```sh
	load_config
	detect_date_flavor
	load_plugins
```
Not reached for the empty/help/no-args early-return case, so `hw` / `hw help` stay fast and side-effect-free.

### 2. Command registration & dispatch

Plugin commands are functions named `cmd_plugin_<name>` — mirrors the existing `cmd_<name>` convention with a `plugin_` infix that can never collide with a built-in.

Dispatch fallback (`main()`'s `*)` arm, ~headway.sh:989-993) becomes:
```sh
	*)
		_main_plugin_fn="cmd_plugin_${cmd}"
		if command -v "$_main_plugin_fn" >/dev/null 2>&1; then
			"$_main_plugin_fn" "$@"
		else
			err "unknown command: $cmd"
			usage
			return 1
		fi
		;;
	esac
```
Verified under dash: `command -v` correctly detects only existing functions, and `"$fn" "$@"` (invoking through a variable) is genuine POSIX indirect call — correct argv and exit-status propagation, not `eval`, no extra injection surface beyond what dot-sourcing already implies.

**Collision detection:** have `register_plugin` itself check `command -v "cmd_plugin_$_rp_name"` for pre-existence *before* registering. Because `load_plugins` fully sources each file (registration + function definitions) before moving to the next, by the time file B's `register_plugin` call runs, file A's `cmd_plugin_*` function already exists in the shell's function table — regardless of whether each individual file calls `register_plugin` before or after defining its own function. This catches real cross-plugin collisions without requiring a fragile file-internal ordering convention:
```sh
PLUGIN_REGISTRY=""

register_plugin() {
	_rp_name="$1"
	_rp_desc="$2"

	if command -v "cmd_plugin_${_rp_name}" >/dev/null 2>&1; then
		err "warning: plugin command '$_rp_name' redefined by ${PLUGIN_LOADING_FILE:-unknown}"
	fi

	_rp_row=$(printf '%s%s%s%s%s' "$_rp_name" "$US" "$_rp_desc" "$US" "${PLUGIN_LOADING_FILE:-unknown}")
	PLUGIN_REGISTRY="${PLUGIN_REGISTRY}${_rp_row}
"
}
```
(`US` is the existing unit-separator constant already used by `parse_line`'s awk tokenizer.) Last-loaded plugin wins on a real collision (ordinary shell function redefinition) plus the stderr warning above.

### 3. `hw plugins` listing

```sh
cmd_plugins() {
	if [ -z "$PLUGIN_REGISTRY" ]; then
		printf 'no plugins loaded\n'
		return 0
	fi
	printf '%s' "$PLUGIN_REGISTRY" | while IFS="$US" read -r _cp_name _cp_desc _cp_file; do
		[ -n "$_cp_name" ] || continue
		printf '%-16s %-40s (%s)\n' "$_cp_name" "$_cp_desc" "$_cp_file"
	done
}
```
Add `plugins) cmd_plugins "$@" ;;` to `main()`'s dispatch case (it's a built-in, not routed through the plugin fallback), and a one-line entry in `usage()`'s Maintenance section.

### 4. Namespacing convention (documentation-enforced, matches existing style)

- Plugin commands: `cmd_plugin_<name>` (enforced by dispatch).
- Plugin-internal helpers: `_plugin_<pluginname>_<helper>` — mirrors the codebase's existing `_pl_*`/`_lc_*`/`_cvr_*`/`_rv_*`/`_fl_*`/`_rla_*` convention.
- Plugin-internal globals: `PLUGIN_<PLUGINNAME>_<NAME>`.
- Document as off-limits-by-convention: `P_*`, every existing `_xx_*` internal prefix, and the bare config vars.

### 5. Two example plugins (new top-level `plugins/` dir, not auto-loaded)

- **`plugins/burndown.sh`** (read-only): adds `hw burndown`, a 7-day completion-velocity report. Scan `TODO_FILE`'s `x ` lines directly with a plain `while IFS= read -r raw <"$TODO_FILE"` + `parse_line` loop (matching `cmd_check`'s existing direct-read style — not a subshell/`wc -c` counting trick, which works but is inconsistent with the rest of the codebase) plus an awk pass over `DONE_FILE`, bucketed by `P_COMPLETION_DATE`/completion date over the trailing 7 days from `today`.
- **`plugins/snooze.sh`** (mutating): adds `hw snooze <id> [days]` (default 1), pushing a task's due date forward. Shaped identically to the built-in `cmd_due`: `resolve_id` → `parse_line(line_at(...))` → guard not-done → mutate `P_DUE` via `date_add_days` → `format_line` → `replace_line_at` → confirmation `printf`.

Both call `register_plugin "<name>" "<one-line description>"` at file top level and carry a header comment documenting the trust model and install path.

### 6. Tests: `tests/test_plugins.sh`

Follows the established pattern exactly (`setup_sandbox` / `HEADWAY_LIB_ONLY=true; . ./headway.sh` / `detect_date_flavor` / ... / `teardown_sandbox` / `report_and_exit`), calling `load_plugins` explicitly per case (since `HEADWAY_LIB_ONLY` skips `main()`). Cases, using `cat >"$dir/x.sh" <<'EOF' ... EOF` fixtures:
- Missing plugin dir and empty plugin dir are both clean no-ops (`PLUGIN_REGISTRY` stays empty).
- A registered plugin's `cmd_plugin_<name>` is callable directly and via the `command -v` + indirect-call dispatch pattern (simulating `main()`'s fallback, since `main()` itself would `exit`).
- `cmd_plugins` lists a registered name and description.
- A plugin can read/write `TODO_FILE` through headway's own helpers (`resolve_id`/`parse_line`/`replace_line_at`) — proves shared-process access actually works, not just dispatch.
- `HEADWAY_PLUGIN_DIR` override is honored.
- Two plugins registering the same command name: warning on stderr, last-loaded wins.
- A plugin that fails mid-source (`false`) aborts `load_plugins` with exit 1 and a `failed to load plugin: ...` message.
- **Drift guard**: copy the real `plugins/burndown.sh` and `plugins/snooze.sh` into the sandbox plugin dir and exercise them against real sandbox task data (add a task, `load_plugins`, run `cmd_plugin_snooze 1 3`, assert the due date moved; add a completed task, run `cmd_plugin_burndown`, assert today's bucket count is non-zero). This is the only place the shipped examples are tested against the actual current API surface — without it, a future signature change to `collect_view_rows`/`parse_line` could silently break the shipped examples with nothing failing.

No changes needed to `tests/run.sh`, `tests/helpers.sh`, `Makefile`, or `.github/workflows/test.yml` — the new file is picked up automatically by `run.sh`'s existing glob, and CI already covers both dash and ash.

### 7. README updates

- Retract the false "No plugin system" non-goal (lines 126-130), replacing it with a narrower honest one (no plugin marketplace/remote install in v0).
- New "Plugins" section between "Configuration" and "Syncing", covering: the trust model (explicitly equated to the config file's), install instructions, the `cmd_plugin_<name>` authoring contract, the namespacing convention, the abort-on-load-failure behavior and why, the two shipped examples, and the `HEADWAY_PLUGIN_DIR` config var — cross-referencing (not duplicating) the existing Roadmap's separate `hw sync` single-script-wrapper item.
- Add `hw plugins` to the Maintenance command reference block.

## Known accepted limitations (documented, not blocking)

- BusyBox ash's glob sort order for `*.sh` (determining plugin load order) was verified only against dash locally — implementation must confirm it matches under the project's actual Alpine/ash CI job before merging, since no ash binary was available during planning.
- Command-not-found typos inside a plugin bypass headway's own error message under dash (hard 127 abort) — accepted, documented, not worked around.

## Critical files

- `headway.sh` — `PLUGIN_DIR_DEFAULT` constant, new Plugins section (`load_plugins`, `register_plugin`, `PLUGIN_REGISTRY`, `cmd_plugins`), `main()` (one new call + dispatch case entry + fallback rewrite), `usage()` text.
- `plugins/burndown.sh`, `plugins/snooze.sh` — new.
- `tests/test_plugins.sh` — new.
- `README.md` — non-goal retraction + new "Plugins" section + command reference entry.

Reused existing functions, no reinvention: `expand_tilde`, `die`, `err`, `parse_line`, `format_line`, `resolve_id`, `line_at`, `replace_line_at`, `collect_view_rows`, `today`, `date_add_days`, the `US` delimiter constant, and the project's `_prefix_var`-as-local convention throughout.

## Verification (when implemented)

- `make test` (runs `tests/run.sh`) must stay green, including the new `tests/test_plugins.sh`.
- CI must go green on both the `dash` and `ash` Alpine matrix legs — pay specific attention to the ash leg given the unverified-under-ash glob-order limitation above.
- Manual smoke test: `mkdir -p ~/.config/headway/plugins` (in a scratch `$HOME`/sandboxed env, not the real one), copy in `plugins/snooze.sh`, run `hw add "test task"`, `hw snooze 1 3`, confirm the due date shifted; run `hw plugins` and confirm it lists `snooze`; remove the plugin file and confirm `hw snooze 1` now correctly falls through to `unknown command: snooze`.
