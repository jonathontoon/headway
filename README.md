# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

## GitHub sync

headway can back up its todo.txt to a file in a GitHub repository you control. Syncing is manual: nothing touches the network until you run a `sync` command.

### One-time setup

1. Create a [GitHub OAuth App](https://github.com/settings/developers) (Settings → Developer settings → OAuth Apps → New OAuth App). Any homepage/callback URL works — the callback is never used — but **Enable Device Flow** must be checked.
2. Copy `.env.example` to `.env` and set `VITE_GITHUB_CLIENT_ID` to the OAuth App's client ID, then build/deploy. The client ID is public; no client secret is involved.
3. In the terminal UI:

```
login                          # shows a code to enter at github.com/login/device
sync setup you/your-repo       # defaults to branch "main" and path "todo.txt"
sync push                      # commits your tasks to the repo
```

### Commands

| Command                                     | Effect                                                                                 |
| ------------------------------------------- | -------------------------------------------------------------------------------------- |
| `login` / `logout`                          | Connect or disconnect a GitHub account (OAuth device flow)                             |
| `sync setup <owner>/<repo> [branch] [path]` | Choose the repo file to sync with                                                      |
| `sync` / `sync status`                      | Show the sync target, account, and dirty/clean state                                   |
| `sync push [--force]`                       | Commit local tasks to the repo file (warns if the remote changed since your last sync) |
| `sync pull [--force]`                       | Replace local tasks with the repo file (warns if local changes haven't been pushed)    |

### Notes

- GitHub's device-flow endpoints don't allow browser CORS, so the Cloudflare Worker proxies exactly two endpoints (`/api/github/device/code`, `/api/github/device/token`). File reads/writes go directly from the browser to `api.github.com`.
- The access token is stored in `localStorage`. That is acceptable for a personal deployment but is readable by any script that can run on the page — don't reuse a token with broader access than you're comfortable with. The device flow uses the classic `repo` scope (fine-grained tokens aren't available via device flow).
