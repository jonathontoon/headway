import type { TerminalResponse } from '@models/terminalResponse';
import { loadContent } from '@services/storageService';
import { parseTodos, filterTodos } from '@services/todoService';

const listCommand = (args: string[]): TerminalResponse => {
  const filter = args[0] ?? '';

  try {
    const content = loadContent();
    const todos = parseTodos(content);
    const filtered = filter ? filterTodos(filter, todos) : todos;
    const title = filter ? `Todos matching ${filter}` : 'All todos';

    return { type: 'todo-list', todos: filtered, title };
  } catch {
    return { type: 'todo-list', todos: [] };
  }
};

export default listCommand;
