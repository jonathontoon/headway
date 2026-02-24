import {
  useCallback,
  useEffect,
  useRef,
  type ChangeEvent,
  type KeyboardEvent,
  type FunctionComponent,
} from "react";

import { ScrollView, Prompt } from "./base";
import renderResponse from "./renderResponse";
import useViewportResize from "@hooks/useViewportResize";
import { useTerminalStore } from "@contexts/TerminalContext";

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
      {history.map((item) => (
        <div key={item.id}>{renderResponse(item)}</div>
      ))}
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
