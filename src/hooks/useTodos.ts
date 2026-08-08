import { useSyncExternalStore } from "react";
import { todosStore } from "../store/todos/persistence";

export const useTodos = (): readonly string[] =>
  useSyncExternalStore(
    todosStore.subscribe,
    todosStore.getSnapshot,
    todosStore.getServerSnapshot,
  );
