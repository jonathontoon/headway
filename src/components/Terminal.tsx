import {
  useCallback,
  useEffect,
  useRef,
  type ChangeEvent,
  type KeyboardEvent,
  type FunctionComponent,
} from "react";

import ScrollView from "./ScrollView";
import Prompt from "./Prompt";
import TerminalHistory from "./TerminalHistory";
import useViewportResize from "@hooks/useViewportResize";
import { useTerminalStore } from "@stores/useTerminalStore";

interface TerminalProps {
  className?: string;
  onInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onInputKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  hidden?: boolean;
}

const Terminal: FunctionComponent<TerminalProps> = ({
  className = "",
  onInputChange,
  onInputKeyDown,
  disabled = false,
  hidden = false,
}) => {
  const { history, input } = useTerminalStore();
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const scrollToBottom = useCallback(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, []);

  useViewportResize(scrollToBottom);

  useEffect(() => {
    scrollToBottom();
    focusInput();
  }, [history, scrollToBottom, focusInput]);

  return (
    <ScrollView className={className} ref={terminalRef}>
      {/*
        Optimization: TerminalHistory is memoized to prevent re-rendering the
        entire history on every keystroke in the Prompt below.
      */}
      <TerminalHistory history={history} />
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
