import type { TerminalResponse } from "../../types/terminal-response";
import { prependToTodo } from "../todoService";
import withTodos from "./withTodos";

const prependCommand = (args: string[]): TerminalResponse => {
  const indexStr = args[0] ?? "";
  const text = args.slice(1).join(" ");

  if (!indexStr || !text) {
    return {
      type: "status",
      statusType: "error",
      statusText: "Missing arguments.",
      hintText: "Usage: prepend [number] [text]",
    };
  }

  const index = parseInt(indexStr, 10);
  if (isNaN(index) || index < 1) {
    return {
      type: "status",
      statusType: "error",
      statusText: "Invalid todo number.",
      hintText: "Usage: prepend [number] [text]",
    };
  }

  return withTodos(
    index,
    (todos) => prependToTodo(index, text, todos),
    () => ({
      type: "status",
      statusType: "success",
      statusText: `Prepended to todo #${index}.`,
    }),
    "Failed to prepend text."
  );
};

export default prependCommand;
