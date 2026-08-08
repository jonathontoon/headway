import { useSyncExternalStore } from "react";
import { todosStore } from "../store/todos/persistence";

/**
 * Subscribes React components to the current todo list.
 *
 * @returns Current todo.txt lines.
 */
export const useTodos = (): readonly string[] =>
  useSyncExternalStore(
    todosStore.subscribe,
    todosStore.getSnapshot,
    todosStore.getServerSnapshot,
  );
