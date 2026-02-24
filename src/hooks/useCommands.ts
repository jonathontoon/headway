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
} from "@utils/todos";
import { loadContent, saveContent } from "@utils/storage";
import type { TerminalResponse } from "../types/terminal-response";

export const useCommands = () => {
  const { addResponse } = useTerminalStore();

  const executeWithTodos = useCallback(
    (
      mutate: (todos: ReturnType<typeof parseTodos>) => ReturnType<
        typeof parseTodos
      >,
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
          return completeTodo(n, todos);
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

  const archive = useCallback(() => {
    try {
      const content = loadContent();
      const todos = parseTodos(content);
      const completedCount = todos.filter((t) => t.done).length;

      if (completedCount === 0) {
        addResponse([
          {
            type: "status",
            statusType: "waiting",
            statusText: "No completed todos to archive.",
          },
        ]);
        return;
      }

      const updated = archiveTodos(todos);
      saveContent(serializeTodos(updated));
      addResponse([
        {
          type: "status",
          statusType: "success",
          statusText: `Archived ${completedCount} completed todo(s).`,
        },
      ]);
    } catch {
      addResponse([
        {
          type: "status",
          statusType: "error",
          statusText: "Failed to archive todos.",
        },
      ]);
    }
  }, [addResponse]);

  return {
    add,
    list,
    edit,
    done,
    remove,
    archive,
  };
};
