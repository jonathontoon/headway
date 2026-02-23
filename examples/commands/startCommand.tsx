import { type ReactNode } from 'react';
import DefaultResponse from '@organisms/DefaultResponse.tsx';

/**
 * Handles the 'start' command by displaying a server start message.
 */
const handleStartCommand = async (
  pushToHistory: (content: ReactNode) => void
) => {
  await pushToHistory(
    <DefaultResponse responseText="Starting the server..." />
  );
};

export default handleStartCommand;
