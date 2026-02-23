import type { TerminalResponse } from '@models/terminalResponse';
import { loadContent, saveContent } from '@services/storageService';
import { parseTodos, deleteTodo, serializeTodos } from '@services/todoService';

const deleteCommand = (args: string[]): TerminalResponse => {
  const indexStr = args[0] ?? '';
  const index = parseInt(indexStr, 10);

  if (!indexStr || isNaN(index) || index < 1) {
    return {
      type: 'status',
      statusType: 'error',
      statusText: 'Invalid todo number.',
      hintText: 'Usage: delete [number]',
    };
  }

  try {
    const content = loadContent();
    const todos = parseTodos(content);

    if (index > todos.length) {
      return {
        type: 'status',
        statusType: 'error',
        statusText: `Todo #${index} not found.`,
      };
    }

    const updated = deleteTodo(index, todos);
    const serialized = serializeTodos(updated);
    saveContent(serialized);

    return {
      type: 'status',
      statusType: 'success',
      statusText: `Deleted todo #${index}.`,
    };
  } catch {
    return {
      type: 'status',
      statusType: 'error',
      statusText: 'Failed to delete todo.',
    };
  }
};

export default deleteCommand;
