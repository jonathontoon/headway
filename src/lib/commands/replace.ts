import type { TerminalResponse } from "../../types/terminal-response";
import { replaceTodo } from "../todoService";
import withTodos from "./withTodos";

const replaceCommand = (args: string[]): TerminalResponse => {
  const indexStr = args[0] ?? "";
  const text = args.slice(1).join(" ");

  if (!indexStr || !text) {
    return {
      type: "status",
      statusType: "error",
      statusText: "Missing arguments.",
      hintText: "Usage: replace [number] [text]",
    };
  }

  const index = parseInt(indexStr, 10);
  if (isNaN(index) || index < 1) {
    return {
      type: "status",
      statusType: "error",
      statusText: "Invalid todo number.",
      hintText: "Usage: replace [number] [text]",
    };
  }

  return withTodos(
    index,
    (todos) => replaceTodo(index, text, todos),
    () => ({
      type: "status",
      statusType: "success",
      statusText: `Replaced todo #${index}.`,
    }),
    "Failed to replace todo."
  );
};

export default replaceCommand;
