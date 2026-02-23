import type { ReactNode } from 'react';
import StatusResponse from '@common/StatusResponse';
import { loadContent, saveContent } from '@services/storageService';
import { parseTodos, addTodo, serializeTodos } from '@services/todoService';

/**
 * Handles the 'add' command to add a new todo.
 */
const addCommand = async (
  text: string,
  pushToHistory: (content: ReactNode) => void
) => {
  if (!text.trim()) {
    pushToHistory(
      <StatusResponse
        statusType="error"
        statusText="No todo text provided."
        hintText="Usage: add [todo text]"
      />
    );
    return;
  }

  try {
    const content = loadContent();
    const todos = parseTodos(content);
    const updated = addTodo(text, todos);
    const serialized = serializeTodos(updated);
    saveContent(serialized);

    pushToHistory(
      <StatusResponse statusType="success" statusText={`Added: ${text}`} />
    );
  } catch {
    pushToHistory(
      <StatusResponse statusType="error" statusText="Failed to add todo." />
    );
  }
};

export default addCommand;
