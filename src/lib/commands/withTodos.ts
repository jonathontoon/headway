import type { TerminalResponse } from "../../types/terminal-response";
import { loadContent, saveContent } from "../../utils/storage";
import { parseTodos, serializeTodos } from "../todoService";
import type { TodoItem } from "../models";

const withTodos = (
  index: number,
  mutate: (todos: TodoItem[]) => TodoItem[],
  onSuccess: () => TerminalResponse,
  errorText = "Operation failed."
): TerminalResponse => {
  try {
    const todos = parseTodos(loadContent());

    if (index > todos.length) {
      return {
        type: "status",
        statusType: "error",
        statusText: `Todo #${index} not found.`,
      };
    }

    saveContent(serializeTodos(mutate(todos)));
    return onSuccess();
  } catch {
    return {
      type: "status",
      statusType: "error",
      statusText: errorText,
    };
  }
};

export default withTodos;
