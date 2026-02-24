import type { TerminalResponse } from "../../types/terminal-response";
import { loadContent } from "../../utils/storage";
import { parseTodos, filterTodos } from "../todoService";

const listCommand = (args: string[]): TerminalResponse => {
  const filter = args[0] ?? "";

  try {
    const content = loadContent();
    const todos = parseTodos(content);
    const filtered = filter ? filterTodos(filter, todos) : todos;
    const title = filter ? `Todos matching ${filter}` : "All todos";

    return { type: "todo", todos: filtered, title };
  } catch {
    return { type: "todo", todos: [] };
  }
};

export default listCommand;
