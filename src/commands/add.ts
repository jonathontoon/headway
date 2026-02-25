import type { TerminalResponse } from "@types";
import { MAX_TODO_LENGTH } from "@constants";
import { addTodo } from "@utils/todos";
import { mutateTodos } from "@utils/commands";

export const aliases = ["add", "a"];

export const execute = (args: string[]): TerminalResponse[] => {
  const text = args.join(" ").trim();

  if (!text) {
    return [
      {
        type: "status",
        statusType: "error",
        statusText: "No text provided.",
        hintText: "Usage: add [task text]",
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

  const result = mutateTodos((todos) => addTodo(text, todos), "Failed to add task.");
  if ("error" in result) return result.error;

  return [
    { type: "status", statusType: "success", statusText: `Added: ${text}` },
    { type: "todo", todos: result.updated, title: undefined },
  ];
};
