# Changelog

All notable changes to `headway` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Real line editing in `headway shell`: arrow-key cursor movement, Home/End, Backspace/Delete, and Up/Down/PgUp/PgDn history recall, all built in pure POSIX `sh`. History persists across sessions (`~/.config/headway/history`, or `$HEADWAY_HISTORY`).

### Changed

- `edit <id> <text>` now replaces the task line directly; `edit <id>` alone still opens `$EDITOR`.

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
