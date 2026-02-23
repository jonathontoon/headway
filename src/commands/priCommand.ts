import type { TerminalResponse } from '@models/terminalResponse';
import { loadContent, saveContent } from '@services/storageService';
import { parseTodos, setPriority, serializeTodos } from '@services/todoService';

const priCommand = (args: string[]): TerminalResponse => {
  const indexStr = args[0] ?? '';
  const priorityStr = args[1] ?? '';

  if (!indexStr || !priorityStr || !/^[A-Z]$/.test(priorityStr)) {
    return {
      type: 'status',
      statusType: 'error',
      statusText: 'Invalid arguments.',
      hintText: 'Usage: pri [number] [A-Z]',
    };
  }

  const index = parseInt(indexStr, 10);
  if (isNaN(index) || index < 1) {
    return {
      type: 'status',
      statusType: 'error',
      statusText: 'Invalid todo number.',
      hintText: 'Usage: pri [number] [A-Z]',
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

    const updated = setPriority(index, priorityStr, todos);
    const serialized = serializeTodos(updated);
    saveContent(serialized);

    return {
      type: 'status',
      statusType: 'success',
      statusText: `Set priority (${priorityStr}) for todo #${index}.`,
    };
  } catch {
    return {
      type: 'status',
      statusType: 'error',
      statusText: 'Failed to set priority.',
    };
  }
};

export default priCommand;
