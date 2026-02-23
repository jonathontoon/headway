import {
  Fragment,
  useCallback,
  useEffect,
  type ChangeEvent,
  type KeyboardEvent,
  type FunctionComponent,
  type RefObject,
} from 'react';

import ScrollView from '@molecules/ScrollView.tsx';
import Prompt from '@organisms/Prompt.tsx';

import { type TerminalHistoryItem } from '@hooks/useTerminal.ts';

interface TerminalProps {
  className?: string;
  history: TerminalHistoryItem[];
  input: string;
  inputRef: RefObject<HTMLInputElement>;
  terminalRef: RefObject<HTMLDivElement>;
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
      {history.map((line: TerminalHistoryItem, index: number) => (
        <Fragment key={`${index}-${line}`}>{line}</Fragment>
      ))}
      {!hidden && (
        <Prompt
          value={input}
          onChange={onInputChange}
          onKeyDown={onInputKeyDown}
          placeholder="Write something awesome"
          ref={inputRef}
          disabled={disabled}
        />
      )}
    </ScrollView>
  );
};

export default Terminal;
