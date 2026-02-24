# Proposed Changes

A review of the Headway terminal todo app codebase, identifying areas for improvement and restructuring.

---

## 1. Action Boilerplate

**Files:** `src/actions/append.ts`, `prepend.ts`, `pri.ts`, `done.ts`, `delete.ts`, `depri.ts`, `replace.ts`

Every mutating action repeats the same pattern:

```
loadContent() → parseTodos() → validate index → mutate → serializeTodos() → saveContent()
```

Each file independently handles index parsing, bounds checking, and the load/parse/serialize/save cycle. This results in ~15 near-identical lines per action.

**Suggestion:** Extract a shared helper that handles the load/parse/serialize/save cycle and index validation, so each action only specifies its unique logic (the mutation and success message).

---

## 2. `pushCommandToHistory` Does Very Little

**File:** `src/utilities/pushCommandToHistory.ts`

This function wraps a single expression — `pushResponses([{ type: 'prompt', value: command }])`. It's called once in `App.tsx` and adds indirection without value.

**Suggestion:** Inline it in `App.tsx` or fold it into the command execution flow.

---

## 3. `@common` Alias Points to `src/components`

**File:** `vite.config.ts`

The `@common` alias maps to `src/components/`, but there's nothing "common" about it — it's the only components directory. The old `src/components/common/` subdirectory was flattened but the alias name wasn't updated.

**Suggestion:** Rename the alias to `@components` to match the actual directory.

---

## 4. HelpResponse Is Hardcoded HTML

**File:** `src/components/HelpResponse.tsx`

The help text is fully hardcoded as JSX with repeated grid markup for each command entry. Adding or renaming a command requires editing HTML in two places (the registry and the help component).

**Suggestion:** Drive the help output from a data structure (e.g. command metadata in the registry) so it stays in sync automatically.

---

## 5. `renderResponse` Switch Could Be a Map

**File:** `src/components/renderResponse.tsx`

The switch statement over `item.type` maps each response type to a component. A lookup object (`Record<string, Component>`) would be more concise and easier to extend.

**Suggestion:** Replace the switch with a component map, similar to how the action registry works.

---

## 6. `append`/`prepend` Don't Re-parse Contexts and Projects

**Files:** `src/services/todoService.ts` — `appendToTodo`, `prependToTodo`

These functions modify `text` but don't re-extract `contexts` and `projects`. After appending `@home` to a todo, the `contexts` array won't include `@home` until the next full parse (page reload or re-load from storage).

**Suggestion:** Re-parse the todo line after text modification, similar to how `replaceTodo` calls `parseTodoLine`.

---

## 7. No Command History Navigation

**File:** `src/App.tsx`

The terminal has no up/down arrow history. Users can't recall previous commands, which is a basic terminal expectation.

**Suggestion:** Track a command history array in state and navigate it with arrow keys.

---

## 8. No Tests

There are no test files anywhere in the project. The `todoService.ts` parser and the action functions are pure and highly testable.

**Suggestion:** Add Vitest and write unit tests for `todoService` and the action modules at minimum.

---

## 9. `delay.ts` and `argumentAtIndex.ts` May Be Unused

**Files:** `src/utilities/delay.ts`, `src/utilities/argumentAtIndex.ts`

These utilities exist but may not be imported anywhere in the current codebase.

**Suggestion:** Verify usage and remove if dead code.

---

## 10. `awaitingInput` Flow Is Wired but Unused

**Files:** `src/reducers/terminalReducer.ts`, `src/App.tsx`

The reducer has `SET_AWAITING_INPUT` and `App.tsx` checks for `awaitingInput` state, but no command currently sets it. This is scaffolding for a feature that doesn't exist yet.

**Suggestion:** Either implement interactive prompts (e.g. "are you sure?" for archive/delete) or remove the dead code.

---

## 11. Deleted Files Still in Git Staging

The git status shows many files under `src/commands/` and `src/components/common/` as deleted but not yet committed. The new `src/actions/` and flattened `src/components/` replacements are untracked.

**Suggestion:** Stage and commit the migration cleanly so the branch history is clear.

---

## 12. `tag-list` Response Rendering Is Inline

**File:** `src/components/renderResponse.tsx` (lines 29–42)

The `tag-list` case renders its content directly inside the switch rather than delegating to a dedicated component like other response types.

**Suggestion:** Extract a `TagListResponse` component for consistency with the other response types.
