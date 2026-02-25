import type { TerminalResponse } from "@types";
import { deleteTodo } from "@utils/todos";
import { parseTaskNumber, mutateTodos } from "@utils/commands";

export const aliases = ["remove", "rm"];

export const execute = (args: string[]): TerminalResponse[] => {
  if (!args[0]) {
    return [
      {
        type: "status",
        statusType: "error",
        statusText: "Missing task number.",
        hintText: "Usage: remove [number]",
      },
    ];
  }

  if (args.length > 1) {
    return [
      {
        type: "status",
        statusType: "error",
        statusText: "Invalid arguments.",
        hintText: "Usage: remove [number]",
      },
    ];
  }

  const parsed = parseTaskNumber(args[0]);
  if ("error" in parsed) return parsed.error;
  const { n } = parsed;

  const result = mutateTodos((todos) => {
    if (n < 1 || n > todos.length) return todos;
    return deleteTodo(n, todos);
  }, "Failed to remove task.");
  if ("error" in result) return result.error;

  return [
    { type: "status", statusType: "success", statusText: `Removed task #${n}.` },
    { type: "todo", todos: result.updated, title: undefined },
  ];
};
