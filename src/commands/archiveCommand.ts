import type { TerminalResponse } from '@models/terminalResponse';
import { loadContent, saveContent } from '@services/storageService';
import {
  parseTodos,
  archiveTodos,
  serializeTodos,
} from '@services/todoService';

const archiveCommand = (): TerminalResponse => {
  try {
    const content = loadContent();
    const todos = parseTodos(content);
    const completedCount = todos.filter((t) => t.done).length;

    if (completedCount === 0) {
      return {
        type: 'status',
        statusType: 'waiting',
        statusText: 'No completed todos to archive.',
      };
    }

    const updated = archiveTodos(todos);
    const serialized = serializeTodos(updated);
    saveContent(serialized);

    return {
      type: 'status',
      statusType: 'success',
      statusText: `Archived ${completedCount} completed todo(s).`,
    };
  } catch {
    return {
      type: 'status',
      statusType: 'error',
      statusText: 'Failed to archive todos.',
    };
  }
};

export default archiveCommand;
