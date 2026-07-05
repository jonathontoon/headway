import {
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { formatPromptSymbol } from "../services/terminalFormat";
import { TERMINAL_PROMPT, KEYBOARD_KEYS } from "../constants";

type TerminalCommandFormProps = {
  readonly command: string;
  readonly onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  readonly onChange: (command: string) => void;
  readonly onNavigateHistory: (direction: "previous" | "next") => void;
};

export function TerminalCommandForm({
  command,
  onSubmit,
  onChange,
  onNavigateHistory,
}: TerminalCommandFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [cursorPosition, setCursorPosition] = useState(command.length);

  function syncCursorPosition() {
    setCursorPosition(inputRef.current?.selectionStart ?? 0);
  }

  useLayoutEffect(() => {
    syncCursorPosition();
  }, [command]);

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === KEYBOARD_KEYS.arrowUp) {
      event.preventDefault();
      onNavigateHistory("previous");
      return;
    }

    if (event.key === KEYBOARD_KEYS.arrowDown) {
      event.preventDefault();
      onNavigateHistory("next");
    }
  }

  const before = command.slice(0, cursorPosition);
  const after = command.slice(cursorPosition + 1);

  return (
    <form className="terminal-line terminal-form" onSubmit={onSubmit}>
      <label className="prompt" htmlFor="terminal-command">
        {formatPromptSymbol(TERMINAL_PROMPT)}
      </label>
      <div className="terminal-input-wrapper">
        <input
          ref={inputRef}
          id="terminal-command"
          aria-label="Terminal command"
          autoComplete="off"
          autoFocus
          className="terminal-input"
          value={command}
          onChange={(event) => onChange(event.currentTarget.value)}
          onKeyDown={handleKeyDown}
          onKeyUp={syncCursorPosition}
          onClick={syncCursorPosition}
          onSelect={syncCursorPosition}
        />
        <span className="terminal-input-display" aria-hidden="true">
          {before}
          <span className="terminal-cursor">█</span>
          {after}
        </span>
      </div>
    </form>
  );
}
