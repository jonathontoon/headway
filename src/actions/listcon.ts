import type { TerminalResponse } from '@models/terminalResponse';
import { loadContent } from '@services/storageService';
import { parseTodos, getUniqueContexts } from '@services/todoService';

const listconCommand = (): TerminalResponse => {
  try {
    const content = loadContent();
    const todos = parseTodos(content);
    const tags = getUniqueContexts(todos);

    if (tags.length === 0) {
      return {
        type: 'status',
        statusType: 'waiting',
        statusText: 'No contexts found.',
      };
    }

    return { type: 'tag-list', tags, variant: 'context' };
  } catch {
    return {
      type: 'status',
      statusType: 'error',
      statusText: 'Failed to list contexts.',
    };
  }
};

export default listconCommand;
