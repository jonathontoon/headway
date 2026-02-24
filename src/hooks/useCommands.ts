import { useCallback } from "react";
import { useTerminalStore } from "@contexts/TerminalContext";
import {
  parseTodos,
  serializeTodos,
  addTodo,
  completeTodo,
  deleteTodo,
  filterTodos,
  archiveTodos,
  replaceTodo,
} from "@utils/todos"; // archiveTodos is used by done command
import { loadContent, saveContent } from "@utils/storage";
import type { TerminalResponse } from "@types";

export const useCommands = () => {
  const { addResponse } = useTerminalStore();

  const executeWithTodos = useCallback(
    (
      mutate: (
        todos: ReturnType<typeof parseTodos>
      ) => ReturnType<typeof parseTodos>,
      onSuccess: () => TerminalResponse,
      errorText: string = "Operation failed."
    ) => {
      try {
        const content = loadContent();
        const todos = parseTodos(content);
        const updated = mutate(todos);
        saveContent(serializeTodos(updated));
        addResponse([onSuccess()]);
      } catch {
        addResponse([
          {
            type: "status",
            statusType: "error",
            statusText: errorText,
          },
        ]);
      }
    },
    [addResponse]
  );

  const add = useCallback(
    (text: string) => {
      if (!text.trim()) {
        addResponse([
          {
            type: "status",
            statusType: "error",
            statusText: "No todo text provided.",
            hintText: "Usage: add [todo text]",
          },
        ]);
        return;
      }
      executeWithTodos(
        (todos) => addTodo(text, todos),
        () => ({
          type: "status",
          statusType: "success",
          statusText: `Added: ${text}`,
        }),
        "Failed to add todo."
      );
    },
    [executeWithTodos, addResponse]
  );

  const list = useCallback(
    (filter?: string) => {
      try {
        const content = loadContent();
        const todos = parseTodos(content);
        const filtered = filter ? filterTodos(filter, todos) : todos;
        const title = filter ? `Todos matching ${filter}` : "All todos";
        addResponse([{ type: "todo", todos: filtered, title }]);
      } catch {
        addResponse([{ type: "todo", todos: [] }]);
      }
    },
    [addResponse]
  );

  const edit = useCallback(
    (n: number, text: string) => {
      if (!text.trim()) {
        addResponse([
          {
            type: "status",
            statusType: "error",
            statusText: "Missing arguments.",
            hintText: "Usage: edit [number] [text]",
          },
        ]);
        return;
      }
      executeWithTodos(
        (todos) => {
          if (n < 1 || n > todos.length) return todos;
          return replaceTodo(n, text, todos);
        },
        () => ({
          type: "status",
          statusType: "success",
          statusText: `Edited todo #${n}.`,
        }),
        "Failed to edit todo."
      );
    },
    [executeWithTodos, addResponse]
  );

  const done = useCallback(
    (n: number) => {
      executeWithTodos(
        (todos) => {
          if (n < 1 || n > todos.length) return todos;
          const completed = completeTodo(n, todos);
          return archiveTodos(completed);
        },
        () => ({
          type: "status",
          statusType: "success",
          statusText: `Marked todo #${n} as complete.`,
        }),
        "Failed to mark todo complete."
      );
    },
    [executeWithTodos]
  );

  const remove = useCallback(
    (n: number) => {
      executeWithTodos(
        (todos) => {
          if (n < 1 || n > todos.length) return todos;
          return deleteTodo(n, todos);
        },
        () => ({
          type: "status",
          statusType: "success",
          statusText: `Removed todo #${n}.`,
        }),
        "Failed to remove todo."
      );
    },
    [executeWithTodos]
  );

  return {
    add,
    list,
    edit,
    done,
    remove,
  };
};
