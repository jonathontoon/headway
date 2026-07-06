# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

<!--
### Added
### Changed
### Deprecated
### Removed
### Fixed
### Security
-->

## [0.12.3] - 2026-07-06

### Fixed

- `stats` output rows were misaligned with the summary line above them; the count column is now wide enough to line up with the summary line's `→ ` prefix.

## [0.12.2] - 2026-07-06

### Fixed

- Terminal cursor color now matches the typed command text (`text-terminal-foreground`) instead of the prompt's `$` symbol color.
- Cursor position now updates promptly on keydown instead of lagging a keystroke behind, by deferring the position read with `requestAnimationFrame` instead of `queueMicrotask`.
- Scrolling to the bottom after submitting a command now reaches the true bottom of the page, accounting for `<main>`'s trailing padding.

## [0.12.1] - 2026-07-06

### Removed

- `echo <text>` command.
- Bare `clear` command (terminal output clearing via typed command; `clear due|priority|tags|project <id>` attribute clearing is unaffected).
- `edit <id>` with no text (the unimplemented `$EDITOR` stub); `edit <id> <text>` is unaffected.
- `export` and `import <todo.txt lines>` help/tab-completion entries, which had never been implemented.

## [0.12.0] - 2026-07-06

Retroactively reconstructed from Conventional Commit history: this project's version
had never been bumped past the `0.0.0` scaffold default, so it did not reflect the
`feat`/`fix` commits already shipped since the Vite/React rewrite. This release
backfills the version to where it should be per semver (12 `feat` commits since
that rewrite → 12 minor bumps), and folds in the fixes made while wiring up this
policy.

### Added

- Terminal prompt UI as the app's primary interface.
- App styling and test coverage refresh.
- Syntax highlighting and terminalcolors.com theme support.
- todo.txt terminal support.
- Departure Mono as the core font.
- Ayu Dark palette with a custom output formatter.
- Browser-aware terminal themes.
- Full Gogh theme catalog support.
- Block cursor rendered over the native caret.
- Native terminal interaction behaviors (history, tab completion, etc.).
- Cursor blink pausing while typing or moving.
- Theme test command and Hyper theme.

### Fixed

- Terminal prompt interactivity.
- Layout values restored after the Tailwind migration.
- Focus outline and tap highlight suppression on the command input.
- Help grid alignment, responsive scale, and scroll bounce.
- Help command/description pairs tightened for mobile.
- Terminal cursor now uses the same foreground color as prompt text instead of the accent color.
- Boot banner version is now read from `package.json` instead of being hardcoded.
