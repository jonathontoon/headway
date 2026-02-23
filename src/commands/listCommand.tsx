import type { ReactNode } from "react";
import TodoListResponse from "@common/TodoListResponse";
import { loadContent } from "@services/storageService";
import { parseTodos, filterTodos } from "@services/todoService";

/**
 * Handles the 'list' command to display todos.
 */
const listCommand = async (
  filter: string,
  pushToHistory: (content: ReactNode) => void
) => {
  try {
    const content = loadContent();
    const todos = parseTodos(content);
    const filtered = filter ? filterTodos(filter, todos) : todos;

    const title = filter ? `Todos matching ${filter}` : "All todos";
    pushToHistory(
      <TodoListResponse todos={filtered} title={title} />
    );
  } catch (error) {
    pushToHistory(
      <TodoListResponse todos={[]} />
    );
  }
};

export default listCommand;
