import { useTerminal } from '../hooks/useTerminal'

const prompt = 'headway@localhost:~$'

export function Terminal() {
  const { state, setCommand, submitCommand, navigateHistory } = useTerminal()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    submitCommand()
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      navigateHistory('previous')
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      navigateHistory('next')
    }
  }

  return (
    <main className="terminal" aria-label="Terminal prompt">
      {state.entries.map((entry) => (
        <div className="terminal-entry" key={entry.id}>
          <p className="terminal-line">
            <span className="prompt">{prompt}</span>
            <span className="command"> {entry.command}</span>
          </p>
          {entry.output !== undefined && (
            <p className="terminal-output">{entry.output}</p>
          )}
        </div>
      ))}

      <form className="terminal-line terminal-form" onSubmit={handleSubmit}>
        <label className="prompt" htmlFor="terminal-command">
          {prompt}
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
  )
}
