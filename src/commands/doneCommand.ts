import type { TerminalResponse } from '@models/terminalResponse';
import { loadContent, saveContent } from '@services/storageService';
import {
  parseTodos,
  completeTodo,
  serializeTodos,
} from '@services/todoService';

const doneCommand = (args: string[]): TerminalResponse => {
  const indexStr = args[0] ?? '';
  const index = parseInt(indexStr, 10);

  if (!indexStr || isNaN(index) || index < 1) {
    return {
      type: 'status',
      statusType: 'error',
      statusText: 'Invalid todo number.',
      hintText: 'Usage: done [number]',
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

    const updated = completeTodo(index, todos);
    const serialized = serializeTodos(updated);
    saveContent(serialized);

    return {
      type: 'status',
      statusType: 'success',
      statusText: `Marked todo #${index} as complete.`,
    };
  } catch {
    return {
      type: 'status',
      statusType: 'error',
      statusText: 'Failed to mark todo complete.',
    };
  }
};

export default doneCommand;
