import type { ReactNode } from 'react';
import StatusResponse from '@common/StatusResponse';
import { loadContent, saveContent } from '@services/storageService';
import { parseTodos, replaceTodo, serializeTodos } from '@services/todoService';

/**
 * Handles the 'replace' command to replace a todo entirely.
 */
const replaceCommand = async (
  args: string,
  pushToHistory: (content: ReactNode) => void
) => {
  const parts = args.trim().split(/\s+/);
  const indexStr = parts[0];
  const text = parts.slice(1).join(' ');

  if (!indexStr || !text) {
    pushToHistory(
      <StatusResponse
        statusType="error"
        statusText="Missing arguments."
        hintText="Usage: replace [number] [text]"
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
        hintText="Usage: replace [number] [text]"
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

    const updated = replaceTodo(index, text, todos);
    const serialized = serializeTodos(updated);
    saveContent(serialized);

    pushToHistory(
      <StatusResponse
        statusType="success"
        statusText={`Replaced todo #${index}.`}
      />
    );
  } catch {
    pushToHistory(
      <StatusResponse statusType="error" statusText="Failed to replace todo." />
    );
  }
};

export default replaceCommand;
