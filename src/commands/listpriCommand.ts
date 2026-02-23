import type { TerminalResponse } from '@models/terminalResponse';
import { loadContent } from '@services/storageService';
import { parseTodos, filterByPriority } from '@services/todoService';

const listpriCommand = (args: string[]): TerminalResponse => {
  const priorityStr = args[0] ?? '';

  if (!priorityStr || !/^[A-Z]$/.test(priorityStr)) {
    return {
      type: 'status',
      statusType: 'error',
      statusText: 'Invalid priority.',
      hintText: 'Usage: listpri [A-Z]',
    };
  }

  try {
    const content = loadContent();
    const todos = parseTodos(content);
    const filtered = filterByPriority(priorityStr, todos);

    if (filtered.length === 0) {
      return {
        type: 'status',
        statusType: 'waiting',
        statusText: `No todos with priority (${priorityStr}).`,
      };
    }

    return { type: 'todo-list', todos: filtered };
  } catch {
    return {
      type: 'status',
      statusType: 'error',
      statusText: 'Failed to list todos by priority.',
    };
  }
};

export default listpriCommand;
