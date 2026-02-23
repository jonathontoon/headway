import type { ReactNode } from 'react';
import StatusResponse from '@common/StatusResponse';
import { loadContent, saveContent } from '@services/storageService';
import { parseTodos, setPriority, serializeTodos } from '@services/todoService';

/**
 * Handles the 'pri' command to set priority on a todo.
 */
const priCommand = async (
  args: string,
  pushToHistory: (content: ReactNode) => void
) => {
  const parts = args.trim().split(/\s+/);
  const indexStr = parts[0];
  const priorityStr = parts[1];

  if (!indexStr || !priorityStr || !/^[A-Z]$/.test(priorityStr)) {
    pushToHistory(
      <StatusResponse
        statusType="error"
        statusText="Invalid arguments."
        hintText="Usage: pri [number] [A-Z]"
      />
    );
    return;
  }

  const index = parseInt(indexStr, 10);
  if (isNaN(index) || index < 1) {
    pushToHistory(
      <StatusResponse
        statusType="error"
        statusText="Invalid todo number."
        hintText="Usage: pri [number] [A-Z]"
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

    const updated = setPriority(index, priorityStr, todos);
    const serialized = serializeTodos(updated);
    saveContent(serialized);

    pushToHistory(
      <StatusResponse
        statusType="success"
        statusText={`Set priority (${priorityStr}) for todo #${index}.`}
      />
    );
  } catch {
    pushToHistory(
      <StatusResponse statusType="error" statusText="Failed to set priority." />
    );
  }
};

export default priCommand;
