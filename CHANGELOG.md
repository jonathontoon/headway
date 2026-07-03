# Changelog

All notable changes to `headway` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

`headway` is now a shell, not a hybrid CLI. Launch it with `headway` and type commands at the prompt. There is no one-shot subcommand mode.

### Added

- Real line editing in the shell: arrow-key cursor movement, Home/End, Backspace/Delete, Up/Down/PgUp/PgDn history recall, and Tab completion (command names, `+Project`, `@tag`). All in pure POSIX `sh`. History persists across sessions (`~/.config/headway/history`, or `$HEADWAY_HISTORY`).
- `headway --version` prints the version and exits. `headway --help` prints top-level usage.
- Every in-shell command accepts `--help` for its own usage line.
- New `show <id>` command prints a labelled detail block for a single task.
- Bulk ids: `complete`, `undo`, and `delete` accept multiple ids in one call (`complete 1 2 3`). Bulk `delete` deletes in descending id order, and a bad id anywhere in the list aborts the whole batch before any mutation.
- `due <id> none`, `tag <id> -@tag`, `tag <id> none`, and `project <id> none` clear the corresponding field — no more reaching for `$EDITOR` to remove a value.
- Relative-date labels in view output: `due:DATE` shows an inline hint of `(yesterday)`, `(today)`, `(tomorrow)`, or a weekday name (`monday`..`sunday`) for dates 2–7 days out. Display-only. Weekday labels always refer to the next occurrence, so `monday` a week from Monday points seven days out (never at today, which is already `today`).
- `list` (without a filter) groups tasks into Overdue / Due today / Upcoming / Someday sections. Section headers appear only when at least two buckets are populated — a single-bucket list still prints flat. Filtered `list +Project` / `list @tag` / `list keyword` stays flat.
- "Did you mean...?" typo suggestions on unknown commands, replacing the full-usage dump.

### Changed

- `edit <id> <text>` replaces the task line directly; `edit <id>` alone still opens `$EDITOR`.
- Usage errors (missing required args, unknown command, unrecognised outer argument) exit **2**; runtime errors continue to exit **1**.
- Id-referencing commands on a missing `TODO_FILE` print a friendly `no tasks yet - try 'add "..."'` instead of leaking `awk: can't open file`.

### Fixed

- BSD `date` arithmetic: positive offsets are now signed explicitly with `+`. Previously an unsigned offset like `-v1d` was interpreted as "set day-of-month to 1" instead of "add one day", producing wrong dates for `+Nd` shorthand, `repeat:` bookkeeping, and any forward arithmetic on macOS or other BSD systems. Also resolves the previously known-failing `tests/test_repeat.sh` on macOS.

### Renamed (breaking)

- `done` → `complete` — avoids collision with the POSIX shell keyword used to close `for`/`while` loops.
- `rm` → `delete` — the `rm` name reused the scariest UNIX command; `delete` reads better in a task manager.
- `move <id> +Project` → `project <id> +Project` — matches the `tag`/`priority`/`due` `<verb> <id> <value>` pattern. The `project +Project` view form is unchanged; `project` now dispatches on argument shape.

### Removed (breaking)

- **One-shot command mode.** `headway <subcommand> ...` from the terminal no longer works; only `headway`, `headway --help`, and `headway --version` are accepted at the outer level. All work happens inside the shell.
- **`hw` binary alias.** `make install` no longer installs a shorter `hw` alongside `headway`.
- **Short flags:** `-h`, `-v`, `-V`. Use `--help` and `--version`.
- **`-y` / `--yes` flag.** Set `CONFIRM_DELETE=false` in the config instead if you want to skip the delete prompt.
- **Command aliases:** `a` (was: `add`), `repl` (was: `shell`), `?` (was: `help`), `quit` (was: `exit`).

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
