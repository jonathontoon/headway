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

## [1.2.0] - 2026-07-11

### Added

- Manual GitHub sync for the todo list: `sync setup <owner>/<repo> [branch] [path]` picks a repo file (defaults `main`/`todo.txt`), `sync push` commits local tasks via the GitHub Contents API, `sync pull` replaces local tasks from the repo, and `sync`/`sync status` reports the target, account, and dirty/clean state. Push and pull detect conflicts (remote changed since last sync, or unpushed local changes) and require `--force` to override.
- `login`/`logout` commands authenticate with GitHub via the OAuth device flow (set `VITE_GITHUB_CLIENT_ID` to an OAuth App with device flow enabled). A new Cloudflare Worker route proxies the two device-flow endpoints that don't allow browser CORS.

## [1.1.0] - 2026-07-11

### Changed

- Task ids now refer to the position in the most recently rendered list (`list`, `today`, `upcoming`, `inbox`, `someday`, `archive`, or the boot dashboard) instead of the raw todo.txt line position, so printed numbers always match display order. Commands that reference an id (`edit`, `show`, `delete`, `complete`, `undo`, `due`, `priority`, `tag`, `project`, `clear`) resolve against that list; deleting invalidates it, so further id references require listing again.

### Fixed

- Priority letters F-Z no longer get a distinct color; only A-E use the warm-to-cool gradient, so color highlights the priorities that matter instead of competing across the full alphabet.
- Task id columns are now right-aligned to the widest id in each rendered list, so priority letters and task text line up regardless of single- vs multi-digit ids.

## [1.0.0] - 2026-07-10

### Added

- Sample todos now cover the full A-Z priority range, multiple tags/projects per task, and every list grouping (overdue, due today, upcoming, someday, completed).
- Priority letters A-Z are each colored distinctly using a warm-to-cool spectrum across the 12 hued terminal colors, instead of D-Z sharing a single muted color.

### Changed

- Task lists are now sorted by priority first, then due date, then original order (previously due date took precedence over priority).

### Removed

- **BREAKING:** The theme catalog, and the `theme set`, `theme random`, and `theme test` commands, have been removed. The app now ships a single, fixed theme based on Earthsong instead of dozens of switchable Gogh-sourced themes.

## [0.16.0] - 2026-07-10

### Added

- Semantic color roles (error, warning, success, info, accent, context, command, muted) resolved per theme at build time, each guaranteed WCAG AA contrast (4.5:1) against that theme's background, with a contrast-blend fallback for themes whose palette can't otherwise meet it.

### Changed

- Terminal output now uses these semantic roles instead of raw ANSI slot colors: projects (`+tag`) and contexts (`@tag`) are visually distinct, priorities D-Z are styled instead of unstyled, and previously uncolored summary headers (`stats`, `projects`) now accent their counts.
- `theme test` now lists each resolved role alongside its source slot and live contrast ratio.

## [0.15.1] - 2026-07-09

### Fixed

- Mobile command input now uses a full-line invisible capture field, making keyboard focus more reliable while keeping the custom terminal cursor as the only visible caret.

## [0.15.0] - 2026-07-08

### Added

- The browser's `theme-color` meta tag now syncs to the active terminal theme's background color, so the address bar / tab chrome dynamically matches whatever theme is selected.

## [0.14.2] - 2026-07-07

### Fixed

- Mobile Safari/Chrome: native command-input caret still flashed briefly on first focus despite being visually hidden. Theme CSS variables are now applied before React mounts, and the input's caret/text now blends into the terminal background color instead of relying on `transparent`, which iOS WebKit doesn't reliably honor.

## [0.14.1] - 2026-07-06

### Fixed

- Mobile Safari: stray native caret left rendered at the start of the command input after typing.
- Mobile Safari: viewport zoomed in when the command input was focused.

## [0.14.0] - 2026-07-06

### Added

- Tab completion now also matches second-word subcommands, e.g. `clear due|priority|tags|project` and `theme set|random|test`.

## [0.13.0] - 2026-07-06

### Added

- `/donate` now redirects (via a Cloudflare `_redirects` rule) to the maintainers' GitHub Sponsors page.

### Changed

- The `donate` command now prints a link built from the current domain (`${origin}/donate`) instead of a hardcoded URL.
- URLs printed in terminal output now render as clickable `<a>` links instead of plain text.

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
