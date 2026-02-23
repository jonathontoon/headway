import type { ReactNode } from 'react';
import StatusResponse from '@common/StatusResponse';
import TodoListResponse from '@common/TodoListResponse';
import { loadContent } from '@services/storageService';
import { parseTodos, filterByPriority } from '@services/todoService';

/**
 * Handles the 'listpri' command to list todos by priority.
 */
const listpriCommand = async (
  priorityStr: string,
  pushToHistory: (content: ReactNode) => void
) => {
  if (!priorityStr || !/^[A-Z]$/.test(priorityStr)) {
    pushToHistory(
      <StatusResponse
        statusType="error"
        statusText="Invalid priority."
        hintText="Usage: listpri [A-Z]"
      />
    );
    return;
  }

  try {
    const content = loadContent();
    const todos = parseTodos(content);
    const filtered = filterByPriority(priorityStr, todos);

    if (filtered.length === 0) {
      pushToHistory(
        <StatusResponse
          statusType="waiting"
          statusText={`No todos with priority (${priorityStr}).`}
        />
      );
    } else {
      pushToHistory(<TodoListResponse todos={filtered} />);
    }
  } catch {
    pushToHistory(
      <StatusResponse
        statusType="error"
        statusText="Failed to list todos by priority."
      />
    );
  }
};

export default listpriCommand;
