import type { TerminalResponse } from "@types";
import { completeTodo, archiveTodos } from "@utils/todos";
import { parseTaskNumber, mutateTodos } from "@utils/commands";

export const aliases = ["done"];

export const execute = (args: string[]): TerminalResponse[] => {
  if (!args[0]) {
    return [
      {
        type: "status",
        statusType: "error",
        statusText: "Missing task number.",
        hintText: "Usage: done [number]",
      },
    ];
  }

  if (args.length > 1) {
    return [
      {
        type: "status",
        statusType: "error",
        statusText: "Invalid arguments.",
        hintText: "Usage: done [number]",
      },
    ];
  }

  const parsed = parseTaskNumber(args[0]);
  if ("error" in parsed) return parsed.error;
  const { n } = parsed;

  const result = mutateTodos((todos) => {
    if (n < 1 || n > todos.length) return todos;
    return archiveTodos(completeTodo(n, todos));
  }, "Failed to mark task complete.");
  if ("error" in result) return result.error;

  return [
    { type: "status", statusType: "success", statusText: `Marked task #${n} as complete.` },
    { type: "todo", todos: result.updated, title: undefined },
  ];
};
