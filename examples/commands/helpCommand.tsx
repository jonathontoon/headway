import type { ReactNode } from 'react';
import HelpResponse from '@organisms/HelpResponse.tsx';

const helpCommand = (pushToHistory: (content: ReactNode) => void) => {
  pushToHistory(<HelpResponse />);
};

export default helpCommand;
