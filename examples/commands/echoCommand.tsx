import { type ReactNode } from 'react';

import StatusResponse from '@organisms/StatusResponse.tsx';
import DefaultResponse from '@organisms/DefaultResponse.tsx';

/**
 * Handles the 'echo' command by displaying the provided text.
 * @param {string[]} args - Array of arguments to echo
 */
const handleEchoCommand = async (
  args: string[],
  pushToHistory: (content: ReactNode) => void
) => {
  if (args.length === 0) {
    pushToHistory(
      <StatusResponse
        statusType="error"
        statusText="Please provide text to echo."
        hintText="Example: echo Hello, world!"
      />
    );
    return;
  }

  pushToHistory(<DefaultResponse responseText={args.join(' ')} />);
};

export default handleEchoCommand;
