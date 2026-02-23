import {
  useCallback,
  useEffect,
  type ChangeEvent,
  type KeyboardEvent,
  type FunctionComponent,
  type RefObject,
} from 'react';

import ScrollView from '@common/ScrollView';
import Prompt from '@common/Prompt';
import renderResponse from '@common/renderResponse';

import type { TerminalResponse } from '@models/terminalResponse';

interface TerminalProps {
  className?: string;
  history: TerminalResponse[];
  input: string;
  inputRef: RefObject<HTMLInputElement | null>;
  terminalRef: RefObject<HTMLDivElement | null>;
  onInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onInputKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  hidden?: boolean;
}

const Terminal: FunctionComponent<TerminalProps> = ({
  className = '',
  history,
  input,
  inputRef,
  terminalRef,
  onInputChange,
  onInputKeyDown,
  disabled = false,
  hidden = false,
}) => {
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
