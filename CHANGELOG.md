# Changelog

All notable changes to `headway` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Real line editing in `headway shell`: arrow-key cursor movement, Home/End, Backspace/Delete, and Up/Down/PgUp/PgDn history recall, all built in pure POSIX `sh`. History persists across sessions (`~/.config/headway/history`, or `$HEADWAY_HISTORY`).
- `-v` / `--version` flag prints the version and exits.
- Every subcommand accepts `-h` / `--help` and prints its own usage line.
- New `show <id>` command prints a labelled detail block for a single task.
- Bulk ids: `complete`, `undo`, and `delete` accept multiple ids in one call (`headway complete 1 2 3`). Bulk `delete` deletes in descending id order, and any bad id in the list aborts the whole batch before any mutation.
- Global `-y` / `--yes` flag skips the `delete` confirmation prompt for the current invocation.
- `due <id> none`, `tag <id> -@tag`, `tag <id> none`, and `project <id> none` clear the corresponding field — no more reaching for `$EDITOR` to remove a value.
- "Did you mean...?" typo suggestions on unknown commands, replacing the previous full-usage dump.

### Changed

- `edit <id> <text>` now replaces the task line directly; `edit <id>` alone still opens `$EDITOR`.
- Usage errors (missing required args, unknown command) now exit **2**; runtime errors continue to exit **1**. Scripts can distinguish "you called it wrong" from "the operation failed".
- Commands run on a fresh install (no `~/todo.txt` yet) print a friendly `no tasks yet - try 'headway add "..."'` message instead of leaking a raw `awk: can't open file`.

### Renamed (breaking)

- `done` → `complete` — avoids collision with the POSIX shell keyword used to close `for`/`while` loops.
- `rm` → `delete` — the `rm` name reused the scariest UNIX command; `delete` reads better in a task manager.
- `move <id> +Project` → `project <id> +Project` — matches the `tag`/`priority`/`due` `<verb> <id> <value>` pattern. The old `project +Project` view form is unchanged; `cmd_project` now dispatches on argument shape.

## [0.1.0] - 2026-06-30

### Added

- Initial release: a POSIX `sh` todo.txt CLI task manager.
- Core commands: `add`, `done`, `undo`, `edit`, `due`, `move`, `priority`, `tag`, `rm`.
- Views: `inbox`, `today`, `upcoming`, `someday`, `logbook`.
- Listing and filtering: `list`, `list +Project`, `list @tag`, full-text search.
- Project commands: `projects`, `project`.
- Maintenance commands: `archive`, `stats`, `check`.
- Recurring tasks via `repeat:daily|weekly|monthly|yearly`.
- Configuration via `~/.config/headway/config` or `$HEADWAY_CONFIG`.
- CI coverage against `dash` and BusyBox `ash` on Alpine Linux.
