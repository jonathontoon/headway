# headway

A terminal-style todo.txt app in your browser. No databases, no signup, no distractions — just your tasks in plain text, synced to GitHub if you want.

## What it does

- **Add/edit/delete tasks** with todo.txt syntax: priorities (A-Z), due dates, projects (+name), contexts (@tag), and metadata
- **Five built-in views**: today/upcoming/inbox/someday/archive, plus search by project or tag
- **Priority-aware sorting**: A-E get warm-to-cool colors; your most important tasks stand out
- **GitHub sync** (optional): back up your todo.txt to a repo you control, pull changes from there, and push when you've made edits

Everything runs client-side. Your tasks live in your browser's localStorage until you sync them to GitHub.

## Getting started

### Run locally

```bash
pnpm install
pnpm run dev
```

Opens at http://localhost:5173.

### Deploy

Headway runs on Cloudflare Workers:

```bash
pnpm run deploy
```

## GitHub sync (optional)

You can back up your tasks to a GitHub repo. Syncing is always manual — nothing touches the network until you run a command.

### Setup

1. Create a [GitHub OAuth App](https://github.com/settings/developers) (Settings → Developer settings → OAuth Apps → New OAuth App)
   - Any homepage/callback URL is fine (the callback is never used)
   - **Enable Device Flow**
2. Copy `.env.example` to `.env` and set `VITE_GITHUB_CLIENT_ID` to your app's client ID
3. Build and deploy
4. In the app:
   ```
   login                    # shows a code to enter at github.com/login/device
   sync setup you/your-repo # defaults to branch "main" and path "todo.txt"
   sync push                # commits your tasks
   ```

### Commands

| Command                                     | What it does                                                                         |
| ------------------------------------------- | ------------------------------------------------------------------------------------ |
| `login` / `logout`                          | Connect or disconnect your GitHub account                                            |
| `sync setup <owner>/<repo> [branch] [path]` | Choose which repo file to sync with                                                  |
| `sync` or `sync status`                     | Show your sync target, account, and whether you have unpushed changes                |
| `sync push [--force]`                       | Commit local tasks to GitHub (warns if the remote file changed since your last sync) |
| `sync pull [--force]`                       | Replace local tasks with what's in the repo (warns if you have unpushed changes)     |

### How it works

- The device-flow login endpoints don't allow browser CORS, so the Cloudflare Worker proxies exactly two routes: `/api/github/device/code` and `/api/github/device/token`. Your actual file reads and writes go directly from the browser to `api.github.com`.
- The app tracks the last-synced file SHA and a content hash of your tasks, so it can detect conflicts (remote changed, or you have unpushed local changes).
- Your GitHub token lives in `localStorage`. That's fine for a personal deployment, but remember it's readable by any script running on the page — don't reuse a token you use for other things.
- Device flow uses the classic `repo` scope (fine-grained tokens aren't available via device flow yet).

## Development

- **Tests**: `pnpm test` (vitest)
- **Format**: `pnpm format:write` (prettier)
- **Lint**: `pnpm lint` (eslint)
- **Build**: `pnpm build`
- **Preview built output**: `pnpm preview` (runs locally via wrangler)

Commits follow [Conventional Commits](https://www.conventionalcommits.org/). Version bumps are semantic and tracked in CHANGELOG.md.

## Stack

- React 19 + TypeScript
- Vite (dev server and build)
- Tailwind CSS (styling)
- Cloudflare Workers (deployment)
- localStorage (persistence)
- GitHub Contents API (sync)
