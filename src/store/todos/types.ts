import type { TerminalOutput } from "../terminal/output";

/** Parsed `key:value` metadata from a todo.txt line. */
export type TodoMetadata = {
  readonly key: string;
  readonly value: string;
};

/** Parsed todo.txt task data used by commands and terminal views. */
export type TodoTask = {
  readonly completed: boolean;
  readonly priority?: string | undefined;
  readonly completionDate?: string | undefined;
  readonly creationDate?: string | undefined;
  readonly text: string;
  readonly projects: readonly string[];
  readonly contexts: readonly string[];
  readonly metadata: readonly TodoMetadata[];
};

/** Result of parsing one todo.txt line. */
export type ParseTodoResult =
  | { readonly ok: true; readonly task: TodoTask }
  | { readonly ok: false; readonly error: string };

/** Current todo list and id view passed into todo command handlers. */
export type TodoCommandState = {
  readonly todos: readonly string[];
  readonly view: readonly number[];
};

/** Todo command result with optional rendered output and replacement view. */
export type TodoCommandResult = {
  readonly nextTodos: readonly string[];
  readonly output?: TerminalOutput | string | undefined;
  readonly view?: readonly number[] | undefined;
};

/** Clock dependency used to make date-based command behavior testable. */
export type TodoClock = {
  readonly today: () => string;
};
