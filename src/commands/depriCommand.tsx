import type { ReactNode } from 'react';
import StatusResponse from '@common/StatusResponse';
import { loadContent, saveContent } from '@services/storageService';
import { parseTodos, removePriority, serializeTodos } from '@services/todoService';

/**
 * Handles the 'depri' command to remove priority from a todo.
 */
const depriCommand = async (
  indexStr: string,
  pushToHistory: (content: ReactNode) => void
) => {
  const index = parseInt(indexStr, 10);

  if (!indexStr || isNaN(index) || index < 1) {
    pushToHistory(
      <StatusResponse
        statusType="error"
        statusText="Invalid todo number."
        hintText="Usage: depri [number]"
      />
    );
    return;
  }

  try {
    const content = loadContent();
    const todos = parseTodos(content);

    if (index > todos.length) {
      pushToHistory(
        <StatusResponse
          statusType="error"
          statusText={`Todo #${index} not found.`}
        />
      );
      return;
    }

    const updated = removePriority(index, todos);
    const serialized = serializeTodos(updated);
    saveContent(serialized);

    pushToHistory(
      <StatusResponse
        statusType="success"
        statusText={`Removed priority from todo #${index}.`}
      />
    );
  } catch {
    pushToHistory(
      <StatusResponse
        statusType="error"
        statusText="Failed to remove priority."
      />
    );
  }
};

export default depriCommand;
