import type { TerminalResponse } from '@models/terminalResponse';
import { loadContent, saveContent } from '@services/storageService';
import { parseTodos, replaceTodo, serializeTodos } from '@services/todoService';

const replaceCommand = (args: string[]): TerminalResponse => {
  const indexStr = args[0] ?? '';
  const text = args.slice(1).join(' ');

  if (!indexStr || !text) {
    return {
      type: 'status',
      statusType: 'error',
      statusText: 'Missing arguments.',
      hintText: 'Usage: replace [number] [text]',
    };
  }

  const index = parseInt(indexStr, 10);
  if (isNaN(index) || index < 1) {
    return {
      type: 'status',
      statusType: 'error',
      statusText: 'Invalid todo number.',
      hintText: 'Usage: replace [number] [text]',
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

    const updated = replaceTodo(index, text, todos);
    const serialized = serializeTodos(updated);
    saveContent(serialized);

    return {
      type: 'status',
      statusType: 'success',
      statusText: `Replaced todo #${index}.`,
    };
  } catch {
    return {
      type: 'status',
      statusType: 'error',
      statusText: 'Failed to replace todo.',
    };
  }
};

export default replaceCommand;
