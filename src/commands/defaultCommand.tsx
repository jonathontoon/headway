import type { ReactNode } from 'react';
import DefaultResponse from '@common/DefaultResponse';

/**
 * Handles unknown commands by displaying an error message.
 */
const defaultCommand = async (
  command: string,
  pushToHistory: (content: ReactNode) => void
) => {
  pushToHistory(
    <DefaultResponse
      responseText={`Command '${command}' not recognized.`}
      hintText="Type 'help' for available commands."
    />
  );
};

export default defaultCommand;
