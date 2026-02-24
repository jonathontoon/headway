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
import StatusResponse from "./StatusResponse";
import TodoListResponse from "./TodoListResponse";
import TagListResponse from "./TagListResponse";
import HelpResponse from "./HelpResponse";
import IntroResponse from "./IntroResponse";
import LogoResponse from "./LogoResponse";
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
      {history.map((item) => {
        switch (item.type) {
          case "status":
            return <StatusResponse key={item.id} {...item} />;
          case "todo":
            return <TodoListResponse key={item.id} {...item} />;
          case "tag":
            return <TagListResponse key={item.id} {...item} />;
          case "help":
            return <HelpResponse key={item.id} />;
          case "intro":
            return <IntroResponse key={item.id} />;
          case "logo":
            return <LogoResponse key={item.id} />;
          case "default":
            return (
              <StatusResponse
                key={item.id}
                statusType="error"
                statusText={`Command '${item.commandName}' not recognized.`}
                hintText={item.hintText ?? "Type 'help' for available commands."}
              />
            );
          case "prompt":
            return <Prompt key={item.id} {...item} />;
          case "clear":
            return null;
        }
      })}
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
