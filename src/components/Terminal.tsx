import {
  useCallback,
  useEffect,
  type ChangeEvent,
  type KeyboardEvent,
  type FunctionComponent,
} from 'react';

import ScrollView from '@components/ScrollView';
import Prompt from '@components/Prompt';
import renderResponse from '@components/renderResponse';
import { useTerminalState, useTerminalRefs } from '@context/TerminalContext';

interface TerminalProps {
  className?: string;
  onInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onInputKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  hidden?: boolean;
}

const Terminal: FunctionComponent<TerminalProps> = ({
  className = '',
  onInputChange,
  onInputKeyDown,
  disabled = false,
  hidden = false,
}) => {
  const { history, input } = useTerminalState();
  const { inputRef, terminalRef } = useTerminalRefs();

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, [inputRef]);

  useEffect(() => {
    focusInput();
  }, [focusInput]);

  useEffect(() => {
    if (!hidden && !disabled) {
      focusInput();
    }
  }, [hidden, disabled, focusInput]);

  return (
    <ScrollView className={className} ref={terminalRef}>
      {history.map((item, index) => renderResponse(item, index))}
      {!hidden && (
        <Prompt
          value={input}
          onChange={onInputChange}
          onKeyDown={onInputKeyDown}
          placeholder="Write a command..."
          ref={inputRef}
          disabled={disabled}
        />
      )}
    </ScrollView>
  );
};

export default Terminal;
