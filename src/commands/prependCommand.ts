import type { TerminalResponse } from '@models/terminalResponse';
import { loadContent, saveContent } from '@services/storageService';
import {
  parseTodos,
  prependToTodo,
  serializeTodos,
} from '@services/todoService';

const prependCommand = (args: string[]): TerminalResponse => {
  const indexStr = args[0] ?? '';
  const text = args.slice(1).join(' ');

  if (!indexStr || !text) {
    return {
      type: 'status',
      statusType: 'error',
      statusText: 'Missing arguments.',
      hintText: 'Usage: prepend [number] [text]',
    };
  }

  const index = parseInt(indexStr, 10);
  if (isNaN(index) || index < 1) {
    return {
      type: 'status',
      statusType: 'error',
      statusText: 'Invalid todo number.',
      hintText: 'Usage: prepend [number] [text]',
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

    const updated = prependToTodo(index, text, todos);
    const serialized = serializeTodos(updated);
    saveContent(serialized);

    return {
      type: 'status',
      statusType: 'success',
      statusText: `Prepended to todo #${index}.`,
    };
  } catch {
    return {
      type: 'status',
      statusType: 'error',
      statusText: 'Failed to prepend text.',
    };
  }
};

export default prependCommand;
