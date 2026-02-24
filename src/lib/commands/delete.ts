import type { TerminalResponse } from "../../types/terminal-response";
import { deleteTodo } from "../todoService";
import withTodos from "./withTodos";

const deleteCommand = (args: string[]): TerminalResponse => {
  const indexStr = args[0] ?? "";
  const index = parseInt(indexStr, 10);

  if (!indexStr || isNaN(index) || index < 1) {
    return {
      type: "status",
      statusType: "error",
      statusText: "Invalid todo number.",
      hintText: "Usage: delete [number]",
    };
  }

  return withTodos(
    index,
    (todos) => deleteTodo(index, todos),
    () => ({
      type: "status",
      statusType: "success",
      statusText: `Deleted todo #${index}.`,
    }),
    "Failed to delete todo."
  );
};

export default deleteCommand;
