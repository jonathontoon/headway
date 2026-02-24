import type { TerminalResponse } from "../../types/terminal-response";
import { loadContent, saveContent } from "../../utils/storage";
import { parseTodos, addTodo, serializeTodos } from "../todoService";

const addCommand = (args: string[]): TerminalResponse => {
  const text = args.join(" ");

  if (!text.trim()) {
    return {
      type: "status",
      statusType: "error",
      statusText: "No todo text provided.",
      hintText: "Usage: add [todo text]",
    };
  }

  try {
    const content = loadContent();
    const todos = parseTodos(content);
    const updated = addTodo(text, todos);
    const serialized = serializeTodos(updated);
    saveContent(serialized);

    return {
      type: "status",
      statusType: "success",
      statusText: `Added: ${text}`,
    };
  } catch {
    return {
      type: "status",
      statusType: "error",
      statusText: "Failed to add todo.",
    };
  }
};

export default addCommand;
