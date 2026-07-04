# headway

> **headway** *(n.)* forward movement or progress toward achieving a goal.

A minimal CLI task manager that gives you a calm, structured way to move tasks forward, with the portability of the [todo.txt](http://todotxt.org) format.

Your tasks are a plain text file. Every tool you already love can read it. `headway` just makes it feel effortless.

---

## Table of Contents

- [Why headway?](#why-headway)
- [The File Format](#the-file-format)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [The Shell](#the-shell)
- [Command Reference](#command-reference)
- [Configuration](#configuration)
- [Uninstall](#uninstall)
- [Interoperability](#interoperability)
- [Philosophy](#philosophy)
- [Architecture](#architecture)
- [Contributing](#contributing)
- [License](#license)

---

## Why headway?

Most todo apps make a trade-off you shouldn't have to accept:

- **GUI apps** give you beautiful structure but lock your data in a proprietary silo.
- **Plain-text tools** give you portability but ask you to think in flags and syntax.

`headway` refuses the trade-off. It stores everything in a valid, portable `todo.txt` file: parseable by any editor, scriptable with `grep`, syncable with `git`. And it gives you a CLI experience organised around a simple mental model: **Projects, a clean inbox, and dates that do the scheduling for you**.

---

## The File Format

Everything lives in `~/todo.txt` (configurable). Each line is a standard, valid `todo.txt` entry. `headway` adds its vocabulary through `key:value` extensions that other todo.txt tools simply ignore.

### Anatomy of a task

```
(A) 2026-06-29 Write landing page copy +LaunchBlog due:2026-07-04 @deepwork
```

| Part | Meaning |
|---|---|
| `(A)` | Priority (A–Z) |
| `2026-06-29` | Creation date |
| `Write landing page copy` | Task description |
| `+LaunchBlog` | Project |
| `due:2026-07-04` | Due date |
| `@deepwork` | Tag/context |

### Completed tasks

Follows the todo.txt standard. Completion date is prepended automatically, and any priority is dropped from the `(A)` position and preserved as `pri:A` — the convention the spec itself recommends, since most parsers discard priority on completion otherwise.

```
x 2026-07-04 2026-06-29 Write landing page copy +LaunchBlog pri:A
```

Running `headway undo` restores the priority to its original `(A)` position.

### Recurring tasks

```
... repeat:daily   repeat:weekly   repeat:monthly   repeat:yearly
```

When you complete a recurring task, `headway` creates the next occurrence automatically, advancing the due date by the repeat interval.

### Format compatibility

`headway` only ever *adds* `key:value` extensions to a task line — it never removes or rewrites fields it doesn't recognise. A file written by a newer version of `headway` stays fully readable by an older version (unrecognised extensions are simply ignored), and by any other todo.txt tool. Your `todo.txt` is never at risk of being made unreadable by an upgrade.

---

## Installation

### Homebrew (macOS / Linux)

```bash
brew install headway
```

### From source

Requires a POSIX `sh` and the standard tools listed in [Architecture](#architecture) — already present on virtually every system.

```bash
git clone https://github.com/jonathontoon/headway.git
cd headway
make install          # installs to /usr/local/bin/headway
```

### Manual

Download `headway.sh`, make it executable, and alias it:

```bash
curl -O https://raw.githubusercontent.com/jonathontoon/headway/main/headway.sh
chmod +x headway.sh
echo 'alias headway="~/headway.sh"' >> ~/.zshrc
```

---

## Quick Start

`headway` can run one command at a time, or launch an interactive shell when you call it with no arguments:

```bash
headway add "Book flights to Lisbon"
headway today
headway complete 3
```

Launch it with no arguments and you're in a session — type commands at the prompt:

```
$ headway
headway v0.1.0

Good morning! You have 2 open tasks, nothing due today.

Type "help" for commands, "exit" to leave.

headway $ add "Book flights to Lisbon"
added 1: 2026-06-30 Book flights to Lisbon
headway $ add "Write project brief +Apollo due:2026-07-10"
added 2: 2026-06-30 Write project brief +Apollo due:2026-07-10
headway $ add "Call the accountant due:2026-06-30 @calls"
added 3: 2026-06-30 Call the accountant due:2026-06-30 @calls
headway $ today
3: 2026-06-30 Call the accountant due:2026-06-30 @calls (today)
headway $ complete 3
completed 3: x 2026-06-30 2026-06-30 Call the accountant due:2026-06-30 @calls
headway $ inbox
1: 2026-06-30 Book flights to Lisbon
headway $ exit
```

Both forms use the same commands and output. `headway help` prints the command list; `headway --version` prints the version.

---

## The Shell

Launch `headway` and you're at the `headway $` prompt. The shell has real line editing built in pure POSIX `sh` — no `bash`, no `readline`, no external dependency:

- **Left/Right/Home/End** move the cursor
- **Backspace/Delete** edit in place
- **Up/Down** recall previous commands (persistent across sessions in `~/.config/headway/history`, overridable via `$HEADWAY_HISTORY`)
- **Page Up/Down** jump 10 history entries at a time (raw mode intercepts them before the terminal emulator's scrollback would)
- **Tab** completes the partial token at the cursor against command names (first token), `+Project` names, or `@tag` names — a single match fills the token and adds a trailing space; multiple matches print below the prompt
- **Ctrl-C** aborts whatever you're typing without ending the session
- **Ctrl-D** on an empty prompt ends the session (same as `exit`)

Each line is split the same way a shell command line is, so quoting works as expected — `add "Buy milk and eggs"` treats the whole quoted string as one argument. Piped/non-interactive input (`headway < script.txt`) falls back to plain line-at-a-time reading, unaffected by the raw-mode editor.

Use `help` to print the command list.

---

## Command Reference

All commands below are typed at the `headway $` prompt.

### Views

```bash
inbox              # tasks with no project assigned
today              # due today, plus anything overdue
upcoming           # future-dated tasks, in chronological order
someday            # tasks with no due date
logbook            # completed tasks, most recent first

today +LaunchBlog  # any view, filtered by project
upcoming @waiting  # any view, filtered by tag
```

### Adding tasks

```bash
add "task description [+Project] [due:DATE] [@tag]"
```

### Completing tasks

```bash
complete <id> [<id>...]   # mark done, preserving priority as pri:A
undo <id> [<id>...]       # unmark, restoring (A) priority if present
```

Both `complete` and `undo` accept multiple ids in one call. All ids are validated up front, so a bad id anywhere in the list aborts the whole batch — the file is never left half-updated.

### Editing tasks

```bash
edit <id>                        # open task in $EDITOR
edit <id> <text>                 # replace task line directly, no editor
due <id> YYYY-MM-DD              # set or update due date
due <id> today                   # convenience shorthand — writes today's actual date
priority <id> A                  # set priority A–Z
tag <id> @tagname [@tag...]      # add one or more tags
project <id> +Project            # assign task to a project
show <id>                        # print a labelled detail block
delete <id> [<id>...]            # delete permanently (prompts to confirm)
```

Fields are emptied with a dedicated `clear` verb — no magic sentinel values:

```bash
clear due <id> [<id>...]         # clear due date on one or more tasks
clear priority <id> [<id>...]    # clear priority
clear tags <id> [<id>...]        # clear every tag on the task(s)
clear tags <id> @tagname [@tag…] # remove specific tag(s) from a single task
clear project <id> [<id>...]     # clear project
```

`delete` and `clear` accept multiple ids in one call. `delete` removes in descending id order so renumbering doesn't invalidate later ids in the same call. Set `CONFIRM_DELETE=false` in your config to skip the confirmation prompt.

### Listing and filtering

```bash
list                  # all incomplete tasks, grouped by bucket
list +LaunchBlog      # filter by project (flat, no grouping)
list @deepwork        # filter by tag
list "keyword"        # full-text search
```

`list` (with no filter) groups its output into **Overdue**, **Due today**, **Upcoming**, and **Someday** sections. Section headers appear only when at least two buckets are populated — a list that happens to be all-someday or all-overdue still prints flat.

Dates in any view carry an inline relative-date hint after `due:DATE`: `(yesterday)`, `(today)`, `(tomorrow)`, or a weekday name (`monday`..`sunday`) for dates 2–7 days out. Display-only; the `todo.txt` file is unchanged.

### Projects

```bash
projects            # list all projects
project +LaunchBlog # show tasks in a project
```

### Maintenance

```bash
archive             # move completed tasks to done.txt
stats               # summary: counts by view and project
check               # verify todo.txt is well-formed
help                # print the top-level command list
exit                # end the shell session (also Ctrl-D)
```

---

## Configuration

`headway` reads from `~/.config/headway/config` (or `$HEADWAY_CONFIG`).
The interactive shell's history file lives alongside it by default
(`~/.config/headway/history`), overridable via `$HEADWAY_HISTORY`.

```bash
# ~/.config/headway/config

TODO_FILE=~/todo.txt         # where your tasks live
DONE_FILE=~/done.txt         # where completed tasks are archived
EDITOR=vi                    # vi ships on everything; set this to your preference

# Display
COLOR=auto                   # auto: colour only when outputting to a terminal
                             # true: always / false: never
SHOW_IDS=true                # show task numbers in all views

# Theme (raw ANSI SGR codes; only applied when COLOR is active)
THEME_PRIORITY=1;33           # (A) priority marker             — default: bold yellow
THEME_PROJECT=36              # +Project tokens                 — default: cyan
THEME_TAG=35                  # @tag tokens                     — default: magenta
THEME_DUE=1;31                # due:DATE                        — default: bold red
THEME_DATE=2                  # creation/completion dates       — default: dim
THEME_DESC=                   # task description                — default: unstyled
THEME_REPEAT=34               # repeat:INTERVAL                 — default: blue
THEME_DONE=2                  # whole line, once done           — default: dim

# Behaviour
CONFIRM_DELETE=true          # prompt before delete — recommended
```

Theme values are raw SGR parameter codes — the part between `\033[` and
`m` — so codes can be combined with `;` (e.g. `1;33` is bold + yellow).
Leaving a `THEME_*` var unset uses the built-in default shown above;
setting one to an empty string (`THEME_DESC=`) disables styling for just
that field, without needing `COLOR=false` globally. Colorization is
display-only — it never touches what's written to `todo.txt`/`done.txt`,
so switching colours around never touches your task data.

Environment variables override config file values.

---

## Uninstall

### Homebrew (macOS / Linux)

```bash
brew uninstall headway
```

### From source

```bash
make uninstall        # removes /usr/local/bin/headway
```

### Manual

```bash
rm headway.sh
# then remove the alias line you added to ~/.zshrc
```

Uninstalling never touches your data — `~/todo.txt`, `~/done.txt`, and `~/.config/headway/config` are left in place. Delete them yourself if you want a clean slate.

---

## Interoperability

Because `headway` writes valid `todo.txt`, your file works with the whole ecosystem:

- **[todo.txt CLI](https://github.com/todotxt/todo.txt-cli)** — fully compatible
- **[Simpletask](https://github.com/mpcjanssen/simpletask-android)** — Android app, reads the format directly
- **[SwiftoDo](https://swiftodoapp.com)** — iOS app for the same file
- **`grep`, `awk`, `sed`** — because it's just text

The `repeat:` extension is ignored gracefully by tools that don't understand it.

---

## Philosophy

Headway is inspired by [permacomputing](https://permacomputing.net/): frugality (POSIX `sh` only, no runtime to install or update), longevity over novelty (targeting `dash` and BusyBox `ash` — the long-lived floor, not the latest shell feature), plain-text and open formats (todo.txt, readable by any tool that will ever exist), offline-first operation (no network calls, nothing breaks when a server goes away), and self-reliance (one script, small enough for a single person to read, understand, and maintain indefinitely).

A few principles that guide every decision in `headway`:

**Your data is yours.** The source of truth is always `~/todo.txt` — a file you can read, edit, `grep`, back up, or delete without asking anyone's permission.

**Capture first, organise second.** `headway add "thing"` or `add "thing"` inside the shell puts a task in your inbox with zero friction. Adding a project or due date is optional and happens when it matters.

**Due dates, not scheduling steps.** You shouldn't have to tell your task manager both *when* you want to think about something *and* when it's actually due. Give it a date. That's enough.

**The terminal is the interface.** No Electron, no background daemon, no subscription. `headway` is a shell script that does one thing well.

**The floor is further back than you'd think.** `headway`'s `date(1)` flavor detection (see [Portability hazards](#portability-hazards-and-how-theyre-handled)) is deliberately conservative rather than assuming the newest tool on your `$PATH`. In practice that means it runs unmodified on FreeBSD as old as 3.0 (1998) and every Mac OS X release since 10.0 (2001), and on any Linux distribution old enough to have paired GNU `date -d` with a standalone `mktemp` binary — roughly the late 1990s onward. Longevity isn't just a stated value here; it's a property you can point at a specific old machine and check.

---

## Architecture

A concise technical specification of how `headway` is built — useful if you're contributing, packaging it for a new platform, or curious why certain commands are implemented the way they are.

### Implementation

`headway` is written in **POSIX `sh`** — not Bash. It targets the strictest, most minimal shells in common use: `dash` (the default `/bin/sh` on Debian and Ubuntu) and BusyBox `ash` (the default on Alpine and most embedded Linux). It avoids every shell feature outside the POSIX specification — no arrays, no `[[ ]]`, no `local`, no `+=`, no here-strings, no C-style `for` loops. Because POSIX sh is a strict subset of Bash, zsh, and ksh, the same script runs unmodified on all of them. Targeting the floor gets the ceiling for free.

### Dependencies

Beyond the shell itself, `headway` calls only `grep`, `sed`, `awk`, `sort`, `date`, and `mktemp` — tools present by default on every UNIX-like system. There's no package manager, no language runtime, no build step, and no compiled binary. `headway.sh` is the entire program.

### Portability hazards and how they're handled

The shell is rarely where portability bugs come from; the *behaviour* of the standard tools it calls is. `headway` is written to avoid every known divergence between GNU, BSD, and BusyBox implementations of those tools.

| Risk | Divergence | How `headway` avoids it |
|---|---|---|
| In-place editing | GNU `sed -i 's/x/y/' file` vs BSD `sed -i '' 's/x/y/' file` | `sed -i` is never used. Every mutation writes to a temp file via `mktemp`, then `mv`s it over the original. |
| Date arithmetic | GNU `date -d "+1 day"` vs BSD `date -v+1d` | The installed `date` flavour is detected once at runtime and branched on; date math never assumes either form. |
| `awk` features | GNU `awk` ships extensions (`gensub`, richer `printf`) that BusyBox `awk` doesn't implement | All `awk` usage stays within the POSIX-specified feature set, verified directly against BusyBox `awk`. |
| Regex flavour | GNU `grep -P` (Perl regex) has no equivalent in BSD or BusyBox `grep` | Only POSIX basic/extended regular expressions (`grep -E`) are used — never `-P`. |

### Tested against

CI runs the test suite against `dash` and BusyBox `ash` in an Alpine container on every commit — the two strictest shells in common use. Passing there is the floor; Bash, zsh, and ksh are exercised as a correctness check, not the target.

### Supported environments

POSIX sh has no compilation step and no CPU instruction-set requirement, so there's no meaningful lower bound on hardware. `headway` runs anywhere `/bin/sh` exists: macOS, any Linux distribution regardless of libc (glibc or musl), the BSDs, Alpine and other minimal containers, and embedded systems like routers, NAS boxes, and any Raspberry Pi model on any OS bitness.

For comparison, the original [todo.txt CLI](https://github.com/todotxt/todo.txt-cli) requires Bash 4+ and GNU `awk`/`sed`, and its own documentation directs Windows users to install Cygwin specifically to get a compatible shell. `headway` runs natively wherever a POSIX shell already exists — no compatibility layer required.

---

## Contributing

`headway` is a single shell script — but the source lives split across `src/00-preamble.sh` through `src/09-main.sh`, one file per concern (helpers, date, parsing, views, commands, editor, shell, main). `headway.sh` is the concatenation, built by `make build`. It's committed so `curl | sh` and Homebrew keep working, and `make verify` catches drift.

```bash
git clone https://github.com/jonathontoon/headway.git
cd headway
make build                         # regenerate headway.sh from src/*.sh
./headway.sh                       # launch the shell locally
make test                          # run the test suite (builds first)
make verify                        # check that headway.sh matches src/*.sh
```

Please open an issue before starting significant work. Edit `src/*.sh`, not `headway.sh` — the CI verify step will fail if the bundle is out of sync. Keep pull requests focused and the dependency list at zero.

---

## License

MIT — see [LICENSE](LICENSE).

---

*headway — make progress, in plain text.*
