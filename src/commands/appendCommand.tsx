import type { ReactNode } from 'react';
import StatusResponse from '@common/StatusResponse';
import { loadContent, saveContent } from '@services/storageService';
import {
  parseTodos,
  appendToTodo,
  serializeTodos,
} from '@services/todoService';

/**
 * Handles the 'append' command to append text to a todo.
 */
const appendCommand = async (
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
        hintText="Usage: append [number] [text]"
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
        hintText="Usage: append [number] [text]"
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

    const updated = appendToTodo(index, text, todos);
    const serialized = serializeTodos(updated);
    saveContent(serialized);

    pushToHistory(
      <StatusResponse
        statusType="success"
        statusText={`Appended to todo #${index}.`}
      />
    );
  } catch {
    pushToHistory(
      <StatusResponse statusType="error" statusText="Failed to append text." />
    );
  }
};

export default appendCommand;
