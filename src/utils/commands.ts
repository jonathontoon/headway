import type { TerminalResponse, TodoItem } from "@types";
import { useTodoStore } from "@stores/useTodoStore";

/**
 * Parse and validate a task number from a string arg.
 * Returns the integer on success, or an error response array on failure.
 */
export const parseTaskNumber = (
  arg: string
): { n: number } | { error: TerminalResponse[] } => {
  const n = parseInt(arg, 10);
  if (!Number.isInteger(n)) {
    return {
      error: [
        {
          type: "status",
          statusType: "error",
          statusText: "Invalid task number.",
          hintText: "Please provide a valid task number.",
        },
      ],
    };
  }
  return { n };
};

/**
 * Load todos from the store, apply a mutation, save, and return the updated list.
 * Returns the updated todos on success, or an error response array on failure.
 */
export const mutateTodos = (
  mutate: (todos: TodoItem[]) => TodoItem[],
  errorText: string
): { updated: TodoItem[] } | { error: TerminalResponse[] } => {
  try {
    const { todos, setTodos } = useTodoStore.getState();
    const updated = mutate(todos);
    setTodos(updated);
    return { updated };
  } catch (e) {
    return {
      error: [
        {
          type: "status",
          statusType: "error",
          statusText: e instanceof Error ? e.message : errorText,
        },
      ],
    };
  }
};
