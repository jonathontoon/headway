import type { TerminalResponse } from "../../types/terminal-response";
import { replaceTodo } from "@utils/todos";
import withTodos from "./withTodos";

const editCommand = (args: string[]): TerminalResponse => {
  const indexStr = args[0] ?? "";
  const text = args.slice(1).join(" ");

  if (!indexStr || !text) {
    return {
      type: "status",
      statusType: "error",
      statusText: "Missing arguments.",
      hintText: "Usage: edit [number] [text]",
    };
  }

  const index = parseInt(indexStr, 10);
  if (isNaN(index) || index < 1) {
    return {
      type: "status",
      statusType: "error",
      statusText: "Invalid todo number.",
      hintText: "Usage: edit [number] [text]",
    };
  }

  return withTodos(
    index,
    (todos) => replaceTodo(index, text, todos),
    () => ({
      type: "status",
      statusType: "success",
      statusText: `Edited todo #${index}.`,
    }),
    "Failed to edit todo."
  );
};

export default editCommand;
