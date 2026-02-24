import type { TerminalResponse } from "../../types/terminal-response";
import { completeTodo } from "../todoService";
import withTodos from "./withTodos";

const doneCommand = (args: string[]): TerminalResponse => {
  const indexStr = args[0] ?? "";
  const index = parseInt(indexStr, 10);

  if (!indexStr || isNaN(index) || index < 1) {
    return {
      type: "status",
      statusType: "error",
      statusText: "Invalid todo number.",
      hintText: "Usage: done [number]",
    };
  }

  return withTodos(
    index,
    (todos) => completeTodo(index, todos),
    () => ({
      type: "status",
      statusType: "success",
      statusText: `Marked todo #${index} as complete.`,
    }),
    "Failed to mark todo complete."
  );
};

export default doneCommand;
