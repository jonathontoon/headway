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

`headway` refuses the trade-off. It stores everything in a valid, portable `todo.txt` file — parseable by any editor, scriptable with `grep`, syncable with `git` — while giving you a CLI experience organised around a simple mental model: **Projects, a clean inbox, and dates that do the scheduling for you**.

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

Running `hw undo` restores the priority to its original `(A)` position.

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
make install          # installs to /usr/local/bin/hw
```

### Manual

Download `headway.sh`, make it executable, and alias it:

```bash
curl -O https://raw.githubusercontent.com/jonathontoon/headway/main/headway.sh
chmod +x headway.sh
echo 'alias hw="~/headway.sh"' >> ~/.zshrc
```

---

## Quick Start

```bash
# Add a task to your inbox
hw add "Book flights to Lisbon"

# Add a task with a project and deadline
hw add "Write project brief +Apollo due:2026-07-10"

# Something due today
hw add "Call the accountant due:2026-06-30 @calls"

# See what's on for today
hw today

# Mark task 3 as done
hw done 3

# Review everything without a project
hw inbox
```

---

## Command Reference

### Views

```bash
hw inbox              # tasks with no project assigned
hw today              # due today, plus anything overdue
hw upcoming           # future-dated tasks, in chronological order
hw someday            # tasks with no due date
hw logbook            # completed tasks, most recent first

hw today +LaunchBlog  # any view, filtered by project
hw upcoming @waiting  # any view, filtered by tag
```

### Adding tasks

```bash
hw add "task description [+Project] [due:DATE] [@tag]"
hw a  "..."            # shorthand
```

### Completing tasks

```bash
hw done <id>           # mark done, preserving priority as pri:A
hw undo <id>           # unmark, restoring (A) priority if present
```

### Editing tasks

```bash
hw edit <id>           # open task in $EDITOR
hw due <id> YYYY-MM-DD # set or update due date
hw due <id> today      # convenience shorthand — writes today's actual date
hw move <id> +Project  # move to a project
hw priority <id> A     # set priority A–Z (or 'none')
hw tag <id> @tagname   # add a tag
hw rm <id>             # delete task permanently
```

### Listing and filtering

```bash
hw list                  # list all incomplete tasks
hw list +LaunchBlog      # filter by project
hw list @deepwork        # filter by tag
hw list "keyword"        # full-text search
```

### Projects

```bash
hw projects            # list all projects
hw project +LaunchBlog # show tasks in a project
```

### Maintenance

```bash
hw archive             # move completed tasks to done.txt
hw stats               # summary: counts by view and project
hw check               # verify todo.txt is well-formed
```

---

## Configuration

`headway` reads from `~/.config/headway/config` (or `$HEADWAY_CONFIG`).

```bash
# ~/.config/headway/config

TODO_FILE=~/todo.txt         # where your tasks live
DONE_FILE=~/done.txt         # where completed tasks are archived
EDITOR=vi                    # vi ships on everything; set this to your preference

# Display
COLOR=auto                   # auto: colour only when outputting to a terminal
                             # true: always / false: never
DATE_FORMAT=%Y-%m-%d         # ISO 8601 — unambiguous and sorts correctly
SHOW_IDS=true                # show task numbers in all views

# Behaviour
AUTO_ARCHIVE=false           # if true, hw done moves tasks to done.txt immediately
CONFIRM_DELETE=true          # prompt before hw rm — recommended
```

Environment variables override config file values.

---

## Uninstall

### Homebrew (macOS / Linux)

```bash
brew uninstall headway
```

### From source

```bash
make uninstall        # removes /usr/local/bin/hw
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

**Capture first, organise second.** `hw add "thing"` puts a task in your inbox with zero friction. Adding a project or due date is optional and happens when it matters.

**Due dates, not scheduling steps.** You shouldn't have to tell your task manager both *when* you want to think about something *and* when it's actually due. Give it a date. That's enough.

**The terminal is the interface.** No Electron, no background daemon, no subscription. `headway` is a shell script that does one thing well.

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

`headway` is a single shell script. Read it — it's meant to be readable.

```bash
git clone https://github.com/jonathontoon/headway.git
cd headway
./headway.sh add "Fix the thing"   # run locally
make test                          # run the test suite
```

Please open an issue before starting significant work. Keep pull requests focused and the dependency list at zero.

---

## License

MIT — see [LICENSE](LICENSE).

---

*headway — make progress, in plain text.*
