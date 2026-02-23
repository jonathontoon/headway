import type { ReactNode } from 'react';
import StatusResponse from '@common/StatusResponse';
import { loadContent, saveContent } from '@services/storageService';
import {
  parseTodos,
  prependToTodo,
  serializeTodos,
} from '@services/todoService';

/**
 * Handles the 'prepend' command to prepend text to a todo.
 */
const prependCommand = async (
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
        hintText="Usage: prepend [number] [text]"
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
        hintText="Usage: prepend [number] [text]"
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

    const updated = prependToTodo(index, text, todos);
    const serialized = serializeTodos(updated);
    saveContent(serialized);

    pushToHistory(
      <StatusResponse
        statusType="success"
        statusText={`Prepended to todo #${index}.`}
      />
    );
  } catch {
    pushToHistory(
      <StatusResponse statusType="error" statusText="Failed to prepend text." />
    );
  }
};

export default prependCommand;
