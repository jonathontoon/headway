import type { ReactNode } from 'react';
import StatusResponse from '@common/StatusResponse';
import { loadContent, saveContent } from '@services/storageService';
import {
  parseTodos,
  completeTodo,
  serializeTodos,
} from '@services/todoService';

/**
 * Handles the 'done' command to mark a todo as complete.
 */
const doneCommand = async (
  indexStr: string,
  pushToHistory: (content: ReactNode) => void
) => {
  const index = parseInt(indexStr, 10);

  if (!indexStr || isNaN(index) || index < 1) {
    pushToHistory(
      <StatusResponse
        statusType="error"
        statusText="Invalid todo number."
        hintText="Usage: done [number]"
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

    const updated = completeTodo(index, todos);
    const serialized = serializeTodos(updated);
    saveContent(serialized);

    pushToHistory(
      <StatusResponse
        statusType="success"
        statusText={`Marked todo #${index} as complete.`}
      />
    );
  } catch {
    pushToHistory(
      <StatusResponse
        statusType="error"
        statusText="Failed to mark todo complete."
      />
    );
  }
};

export default doneCommand;
