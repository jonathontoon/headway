import type { TerminalResponse } from '@models/terminalResponse';
import { loadContent, saveContent } from '@services/storageService';
import { parseTodos, addTodo, serializeTodos } from '@services/todoService';

const addCommand = (args: string[]): TerminalResponse => {
  const text = args.join(' ');

  if (!text.trim()) {
    return {
      type: 'status',
      statusType: 'error',
      statusText: 'No todo text provided.',
      hintText: 'Usage: add [todo text]',
    };
  }

  try {
    const content = loadContent();
    const todos = parseTodos(content);
    const updated = addTodo(text, todos);
    const serialized = serializeTodos(updated);
    saveContent(serialized);

    return {
      type: 'status',
      statusType: 'success',
      statusText: `Added: ${text}`,
    };
  } catch {
    return {
      type: 'status',
      statusType: 'error',
      statusText: 'Failed to add todo.',
    };
  }
};

export default addCommand;
