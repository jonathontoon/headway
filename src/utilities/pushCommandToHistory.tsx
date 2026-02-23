import { type ReactNode } from 'react';
import Prompt from '@common/Prompt';

/**
 * Adds a command to the terminal history with the prompt prefix.
 */
const pushCommandToHistory = (
  command: string,
  pushToHistory: (content: ReactNode) => void
) => {
  pushToHistory(<Prompt value={command} disabled />);
};

export default pushCommandToHistory;
