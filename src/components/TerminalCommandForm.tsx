import type { FormEvent, KeyboardEvent } from "react";
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

  return (
    <form className="terminal-line terminal-form" onSubmit={onSubmit}>
      <label className="prompt" htmlFor="terminal-command">
        {formatPromptSymbol(TERMINAL_PROMPT)}
      </label>
      <input
        id="terminal-command"
        aria-label="Terminal command"
        autoComplete="off"
        autoFocus
        className="terminal-input"
        value={command}
        onChange={(event) => onChange(event.currentTarget.value)}
        onKeyDown={handleKeyDown}
      />
    </form>
  );
}
