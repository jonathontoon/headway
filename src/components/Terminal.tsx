import { highlight, highlightOutput } from "../services/syntaxHighlight";
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
          <p className="terminal-line">
            <span className="prompt">{TERMINAL_PROMPT}</span>
            <span className="command"> {highlight(entry.command)}</span>
          </p>
          {entry.output !== undefined && (
            <p className="terminal-output">{highlightOutput(entry.output)}</p>
          )}
        </div>
      ))}

      <form className="terminal-line terminal-form" onSubmit={handleSubmit}>
        <label className="prompt" htmlFor="terminal-command">
          {TERMINAL_PROMPT}
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
