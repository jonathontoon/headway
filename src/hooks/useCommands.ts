import { useCallback } from "react";
import { useTerminalStore } from "@contexts/TerminalContext";
import { MAX_TODO_LENGTH } from "@constants";
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
      errorText: string = "Operation failed.",
      showList: boolean = false
    ) => {
      try {
        const content = loadContent();
        const todos = parseTodos(content);
        const updated = mutate(todos);
        saveContent(serializeTodos(updated));
        const responses: TerminalResponse[] = [onSuccess()];
        if (showList) {
          const updatedContent = loadContent();
          const updatedTodos = parseTodos(updatedContent);
          responses.push({ type: "todo", todos: updatedTodos, title: undefined });
        }
        addResponse(responses);
      } catch (e: any) {
        addResponse([
          {
            type: "status",
            statusType: "error",
            statusText: e instanceof Error ? e.message : errorText,
          },
        ]);
      }
    },
    [addResponse]
  );

  const add = useCallback(
    (text: string) => {
      const trimmedText = text.trim();
      if (!trimmedText) {
        addResponse([
          {
            type: "status",
            statusType: "error",
            statusText: "No text provided.",
            hintText: "Usage: add [task text]",
          },
        ]);
        return;
      }

      if (trimmedText.length > MAX_TODO_LENGTH) {
        addResponse([
          {
            type: "status",
            statusType: "error",
            statusText: "Task text too long.",
            hintText: `Maximum length is ${MAX_TODO_LENGTH} characters.`,
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
        "Failed to add task.",
        true
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
        const title = filter ? `Tasks matching ${filter}` : undefined;
        addResponse([{ type: "todo", todos: filtered, title }]);
      } catch {
        addResponse([{ type: "todo", todos: [] }]);
      }
    },
    [addResponse]
  );

  const edit = useCallback(
    (n: number, text: string) => {
      if (!Number.isInteger(n)) {
        addResponse([
          {
            type: "status",
            statusType: "error",
            statusText: "Invalid task number.",
            hintText: "Please provide a valid task number.",
          },
        ]);
        return;
      }

      const trimmedText = text.trim();
      if (!trimmedText) {
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

      if (trimmedText.length > MAX_TODO_LENGTH) {
        addResponse([
          {
            type: "status",
            statusType: "error",
            statusText: "Task text too long.",
            hintText: `Maximum length is ${MAX_TODO_LENGTH} characters.`,
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
          statusText: `Edited task #${n}.`,
        }),
        "Failed to edit task.",
        true
      );
    },
    [executeWithTodos, addResponse]
  );

  const done = useCallback(
    (n: number) => {
      if (!Number.isInteger(n)) {
        addResponse([
          {
            type: "status",
            statusType: "error",
            statusText: "Invalid task number.",
            hintText: "Please provide a valid task number.",
          },
        ]);
        return;
      }

      executeWithTodos(
        (todos) => {
          if (n < 1 || n > todos.length) return todos;
          const completed = completeTodo(n, todos);
          return archiveTodos(completed);
        },
        () => ({
          type: "status",
          statusType: "success",
          statusText: `Marked task #${n} as complete.`,
        }),
        "Failed to mark task complete.",
        true
      );
    },
    [executeWithTodos]
  );

  const remove = useCallback(
    (n: number) => {
      if (!Number.isInteger(n)) {
        addResponse([
          {
            type: "status",
            statusType: "error",
            statusText: "Invalid task number.",
            hintText: "Please provide a valid task number.",
          },
        ]);
        return;
      }

      executeWithTodos(
        (todos) => {
          if (n < 1 || n > todos.length) return todos;
          return deleteTodo(n, todos);
        },
        () => ({
          type: "status",
          statusType: "success",
          statusText: `Removed task #${n}.`,
        }),
        "Failed to remove task.",
        true
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
