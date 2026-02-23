import type { ReactNode } from 'react';
import StatusResponse from '@common/StatusResponse';
import { loadContent, saveContent } from '@services/storageService';
import {
  parseTodos,
  archiveTodos,
  serializeTodos,
} from '@services/todoService';

/**
 * Handles the 'archive' command to remove completed todos.
 */
const archiveCommand = async (
  _args: string,
  pushToHistory: (content: ReactNode) => void
) => {
  try {
    const content = loadContent();
    const todos = parseTodos(content);
    const completedCount = todos.filter((t) => t.done).length;

    if (completedCount === 0) {
      pushToHistory(
        <StatusResponse
          statusType="waiting"
          statusText="No completed todos to archive."
        />
      );
      return;
    }

    const updated = archiveTodos(todos);
    const serialized = serializeTodos(updated);
    saveContent(serialized);

    pushToHistory(
      <StatusResponse
        statusType="success"
        statusText={`Archived ${completedCount} completed todo(s).`}
      />
    );
  } catch {
    pushToHistory(
      <StatusResponse
        statusType="error"
        statusText="Failed to archive todos."
      />
    );
  }
};

export default archiveCommand;
