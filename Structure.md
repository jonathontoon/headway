# Headway — Architecture

## Overview

Headway is a browser-based CLI todo app built with React. It presents a terminal-style interface where the user types commands to manage a todo list stored in `localStorage` using the [todo.txt](https://github.com/todotxt/todo.txt) plain-text format. There is no backend — all logic runs in the browser.

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────┐
│                   Input Layer                        │
│              src/components/Prompt.tsx               │
│        Captures keystrokes, renders cursor           │
└───────────────────────┬─────────────────────────────┘
                        │ prompt string (on Enter)
┌───────────────────────▼─────────────────────────────┐
│                  Command Layer                       │
│   src/hooks/useCommands.ts · src/utils/parse.ts      │
│           src/commands/index.ts (registry)           │
│   Parses input → looks up handler → returns          │
│   TerminalResponse[]                                 │
└────────────┬──────────────────────────┬─────────────┘
             │ reads / writes           │ TerminalResponse[]
┌────────────▼─────────────┐  ┌────────▼──────────────┐
│       Data Layer         │  │      State Layer        │
│  src/utils/todos.ts      │  │ src/contexts/           │
│  src/utils/storage.ts    │  │   TerminalContext.tsx   │
│  Pure todo.txt functions │  │ useReducer: history,    │
│  + localStorage I/O      │  │ input, commandHistory   │
└──────────────────────────┘  └────────┬────────────────┘
                                        │ HistoryItem[]
┌───────────────────────────────────────▼─────────────┐
│                   Render Layer                       │
│  src/components/Terminal.tsx                         │
│  src/components/TerminalHistory.tsx                  │
│  + response components (TodoListResponse, etc.)      │
│  Maps HistoryItem type → memoized component          │
└─────────────────────────────────────────────────────┘
```

---

## Layers

### Input Layer — `src/components/Prompt.tsx`

The prompt component owns the text input. It:

- Renders a styled `<input>` with a custom blinking cursor overlay.
- Listens for `Enter` (submit), `ArrowUp`/`ArrowDown` (command history navigation), and `Escape` (clear).
- Calls `execute(input)` from `useCommands` on submit.
- Reads/writes `input` and `navigateHistory` from `useTerminalStore`.

### Command Layer — `src/hooks/useCommands.ts` · `src/utils/parse.ts` · `src/commands/`

Bridges raw text input to command execution.

**`useCommands.execute(prompt)`** does the following in order:

1. `parseCommand(prompt)` — extracts the first whitespace-delimited token and lowercases it.
2. `parseArguments(prompt, command)` — splits remaining tokens into an array, respecting single and double quotes.
3. Pushes a `{ type: "prompt" }` response so the input echoes into the history.
4. Records the command in `commandHistory` via `addCommand`.
5. Looks up `commandRegistry[command]` — a flat `Record<string, (args: string[]) => TerminalResponse[]>`.
6. Calls the handler or falls back to a `{ type: "default" }` response.
7. Clears the input.

**`src/commands/index.ts`** builds `commandRegistry` by iterating over command modules and registering every alias they export.

### Data Layer — `src/utils/todos.ts` · `src/utils/storage.ts`

Stateless functions for reading and writing todo data.

- **`storage.ts`** wraps `localStorage` under the key `headway:content`. `loadContent()` returns the stored string (or default todos on first run). `saveContent(str)` persists it.
- **`todos.ts`** parses the todo.txt string into `TodoItem[]` objects, and provides pure functions for all mutations (add, complete, delete, edit, prioritise, archive, etc.). Every mutation returns an updated `TodoItem[]` that callers serialise back and pass to `saveContent`.

### State Layer — `src/contexts/TerminalContext.tsx`

A React context backed by `useReducer`. The state shape is:

| Field            | Type            | Purpose                      |
| ---------------- | --------------- | ---------------------------- |
| `history`        | `HistoryItem[]` | All rendered terminal output |
| `input`          | `string`        | Current prompt value         |
| `isProcessing`   | `boolean`       | Async guard (reserved)       |
| `commandHistory` | `string[]`      | Previously entered commands  |
| `historyIndex`   | `number`        | Arrow-key navigation cursor  |

Actions: `PUSH_RESPONSE`, `SET_INPUT`, `SET_PROCESSING`, `RESET`, `ADD_COMMAND`, `SET_HISTORY_INDEX`.

Consumed via `useTerminalStore()`. Provided by `src/providers/TerminalProvider.tsx`.

### Render Layer — `src/components/Terminal.tsx` · `src/components/TerminalHistory.tsx`

- `Terminal` composes `TerminalHistory` + `Prompt` inside a `ScrollView` that auto-scrolls to the bottom on each history update.
- `TerminalHistory` maps each `HistoryItem` to a memoized response component by `type` (see **Response Types** below).
- Each response component receives only its relevant slice of the `HistoryItem` union, keeping re-renders minimal.

---

## Data Flow

```
User types "add Buy milk"
         │
         ▼
   Prompt.tsx (onKeyDown: Enter)
         │
         ▼
   useCommands.execute("add Buy milk")
         │
         ├─ parseCommand  → "add"
         ├─ parseArguments → ["Buy", "milk"]
         │
         ├─ addResponse([{ type: "prompt", value: "add Buy milk" }])
         ├─ addCommand("add Buy milk")
         │
         ├─ commandRegistry["add"](["Buy", "milk"])
         │       │
         │       ├─ todos.ts: parseTodos(loadContent())
         │       ├─ todos.ts: addTodo(todos, "Buy milk")
         │       ├─ storage.ts: saveContent(serialise(updatedTodos))
         │       └─ returns [{ type: "status", ... }]
         │
         └─ addResponse([{ type: "status", ... }])
                 │
                 ▼
         TerminalContext: PUSH_RESPONSE → history grows
                 │
                 ▼
         TerminalHistory re-renders → StatusResponse displayed
```

---

## Command System

Commands live in `src/commands/`. Each module exports:

```ts
export const aliases: string[] = ["add", "a"];

export const execute = (args: string[]): TerminalResponse[] => {
  // read storage, mutate todos, write storage, return responses
};
```

`src/commands/index.ts` loops over all modules and registers every alias into `commandRegistry`. To add a new command: create a module, add it to the `modules` array in `index.ts`.

Current command modules: `add`, `list`, `edit`, `done`, `remove`, `help`.

---

## Response Types

`TerminalResponse` is a discriminated union defined in `src/types.ts`. Each variant maps to a component:

| `type`      | Component              | Description                                       |
| ----------- | ---------------------- | ------------------------------------------------- |
| `"status"`  | `StatusResponse`       | Success / error / info message with optional hint |
| `"todo"`    | `TodoListResponse`     | Rendered list of `TodoItem` objects               |
| `"tag"`     | `TagListResponse`      | List of `@context` or `+project` tags             |
| `"help"`    | `HelpResponse`         | Command reference table                           |
| `"intro"`   | `IntroResponse`        | Welcome message shown on load                     |
| `"logo"`    | `LogoResponse`         | ASCII logo shown on load                          |
| `"default"` | `DefaultResponse`      | Unknown command fallback                          |
| `"clear"`   | _(handled by reducer)_ | Resets `history` to `[]`                          |
| `"prompt"`  | `Prompt` (read-only)   | Echo of submitted input                           |

`HistoryItem` = `TerminalResponse & { id: string }` — the `id` is assigned by the reducer when responses are pushed.

---

## Storage

- **Key:** `headway:content`
- **Format:** todo.txt — one todo per line, plain text.
- **On first run:** `loadContent()` returns a set of default sample todos if the key is absent.
- **Write path:** every mutating command calls `saveContent(serialisedString)` before returning responses, so storage is always in sync with what the user sees.
