import type { TerminalResponse } from "@types";
import { MAX_TODO_LENGTH } from "@constants";
import { replaceTodo } from "@utils/todos";
import { parseTaskNumber, mutateTodos } from "@utils/commands";

export const aliases = ["edit"];

export const execute = (args: string[]): TerminalResponse[] => {
  if (args.length < 2) {
    return [
      {
        type: "status",
        statusType: "error",
        statusText: "Missing arguments.",
        hintText: "Usage: edit [number] [text]",
      },
    ];
  }

  const parsed = parseTaskNumber(args[0]);
  if ("error" in parsed) return parsed.error;
  const { n } = parsed;

  const text = args.slice(1).join(" ").trim();
  if (!text) {
    return [
      {
        type: "status",
        statusType: "error",
        statusText: "Missing arguments.",
        hintText: "Usage: edit [number] [text]",
      },
    ];
  }

  if (text.length > MAX_TODO_LENGTH) {
    return [
      {
        type: "status",
        statusType: "error",
        statusText: "Task text too long.",
        hintText: `Maximum length is ${MAX_TODO_LENGTH} characters.`,
      },
    ];
  }

  const result = mutateTodos((todos) => {
    if (n < 1 || n > todos.length) return todos;
    return replaceTodo(n, text, todos);
  }, "Failed to edit task.");
  if ("error" in result) return result.error;

  return [
    { type: "status", statusType: "success", statusText: `Edited task #${n}.` },
    { type: "todo", todos: result.updated, title: undefined },
  ];
};
