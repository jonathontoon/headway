export type TodoMetadata = {
  readonly key: string;
  readonly value: string;
};

export type TodoTask = {
  readonly completed: boolean;
  readonly priority?: string;
  readonly completionDate?: string;
  readonly creationDate?: string;
  readonly text: string;
  readonly projects: readonly string[];
  readonly contexts: readonly string[];
  readonly metadata: readonly TodoMetadata[];
};

export type ParseTodoResult =
  | { readonly ok: true; readonly task: TodoTask }
  | { readonly ok: false; readonly error: string };

export type TodoCommandState = {
  readonly todos: readonly string[];
};

export type TodoCommandResult = {
  readonly nextTodos: readonly string[];
  readonly output?: string;
};

export type TodoClock = {
  readonly today: () => string;
};
