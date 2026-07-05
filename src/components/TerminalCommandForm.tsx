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
    <form
      className="m-0 text-terminal-foreground whitespace-pre-wrap font-mono text-[13px] leading-[1.9] flex items-baseline"
      onSubmit={onSubmit}
    >
      <label
        data-testid="prompt"
        className="text-terminal-foreground"
        htmlFor="terminal-command"
      >
        {formatPromptSymbol(TERMINAL_PROMPT)}
      </label>
      <div className="relative flex-1 min-w-[8ch] ml-[1ch]">
        <input
          ref={inputRef}
          id="terminal-command"
          aria-label="Terminal command"
          autoComplete="off"
          autoFocus
          className="absolute inset-0 w-full p-0 border-0 outline-0 bg-transparent text-transparent caret-transparent [font:inherit]"
          value={command}
          onChange={(event) => onChange(event.currentTarget.value)}
          onKeyDown={handleKeyDown}
          onKeyUp={syncCursorPosition}
          onClick={syncCursorPosition}
          onSelect={syncCursorPosition}
        />
        <span
          className="relative block whitespace-pre pointer-events-none"
          aria-hidden="true"
        >
          {before}
          <span className="text-terminal-3 animate-terminal-cursor-blink">
            █
          </span>
          {after}
        </span>
      </div>
    </form>
  );
}
