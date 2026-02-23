import type { TerminalResponse } from '@models/terminalResponse';
import { loadContent } from '@services/storageService';
import { parseTodos, getUniqueProjects } from '@services/todoService';

const listprojCommand = (): TerminalResponse => {
  try {
    const content = loadContent();
    const todos = parseTodos(content);
    const tags = getUniqueProjects(todos);

    if (tags.length === 0) {
      return {
        type: 'status',
        statusType: 'waiting',
        statusText: 'No projects found.',
      };
    }

    return { type: 'tag-list', tags, variant: 'project' };
  } catch {
    return {
      type: 'status',
      statusType: 'error',
      statusText: 'Failed to list projects.',
    };
  }
};

export default listprojCommand;
