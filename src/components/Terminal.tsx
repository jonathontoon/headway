import { formatOutput, formatPromptSymbol } from "../services/terminalFormat";
import { useTerminal } from "../hooks/useTerminal";
import { TERMINAL_PROMPT, KEYBOARD_KEYS } from "../constants";

export function Terminal() {
  const { state, setCommand, submitCommand, navigateHistory } = useTerminal();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitCommand();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === KEYBOARD_KEYS.arrowUp) {
      event.preventDefault();
      navigateHistory("previous");
      return;
    }

    if (event.key === KEYBOARD_KEYS.arrowDown) {
      event.preventDefault();
      navigateHistory("next");
    }
  }

  return (
    <main className="terminal" aria-label="Terminal prompt">
      {state.entries.map((entry) => (
        <div className="terminal-entry" key={entry.id}>
          {entry.command !== undefined && (
            <p className="terminal-line">
              <span className="prompt">
                {formatPromptSymbol(TERMINAL_PROMPT)}
              </span>
              <span className="command"> {entry.command}</span>
            </p>
          )}
          {entry.output !== undefined && (
            <div className="terminal-output">{formatOutput(entry.output)}</div>
          )}
        </div>
      ))}

      <form className="terminal-line terminal-form" onSubmit={handleSubmit}>
        <label className="prompt" htmlFor="terminal-command">
          {formatPromptSymbol(TERMINAL_PROMPT)}
        </label>
        <input
          id="terminal-command"
          aria-label="Terminal command"
          autoComplete="off"
          autoFocus
          className="terminal-input"
          value={state.command}
          onChange={(event) => setCommand(event.currentTarget.value)}
          onKeyDown={handleKeyDown}
        />
      </form>
    </main>
  );
}
