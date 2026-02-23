import { type ReactNode } from 'react';
import StatusResponse from '@organisms/StatusResponse.tsx';

/**
 * Handles unrecognized commands by displaying an error message.
 * @param {string} command - The unrecognized command
 */
const handleDefaultCommand = async (
  command: string,
  pushToHistory: (content: ReactNode) => void
) => {
  pushToHistory(
    <StatusResponse
      statusType="error"
      statusText={`'${command}' was not recognized.`}
      hintText="Type 'help' for a list of available commands."
    />
  );
};

export default handleDefaultCommand;
