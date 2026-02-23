import type { ReactNode } from 'react';
import StatusResponse from '@common/StatusResponse';
import Response from '@common/Response';
import { loadContent } from '@services/storageService';
import { parseTodos, getUniqueContexts } from '@services/todoService';

/**
 * Handles the 'listcon' command to list all unique @context tags.
 */
const listconCommand = async (
  _args: string,
  pushToHistory: (content: ReactNode) => void
) => {
  try {
    const content = loadContent();
    const todos = parseTodos(content);
    const contexts = getUniqueContexts(todos);

    if (contexts.length === 0) {
      pushToHistory(
        <StatusResponse statusType="waiting" statusText="No contexts found." />
      );
    } else {
      pushToHistory(
        <Response>
          {contexts.map((ctx, i) => (
            <p key={i} className="text-cyan-400">
              {ctx}
            </p>
          ))}
        </Response>
      );
    }
  } catch {
    pushToHistory(
      <StatusResponse
        statusType="error"
        statusText="Failed to list contexts."
      />
    );
  }
};

export default listconCommand;
