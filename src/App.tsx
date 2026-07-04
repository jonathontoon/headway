import { useState } from 'react'
import './App.css'

const prompt = 'headway@localhost:~$'

type TerminalEntry = {
  readonly id: number
  readonly command: string
  readonly output?: string
}

function formatValue(value: unknown): string {
  if (value === undefined) {
    return 'undefined'
  }

  if (typeof value === 'string') {
    return value
  }

  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function runCommand(command: string): string | undefined {
  const trimmedCommand = command.trim()

  if (trimmedCommand === '') {
    return undefined
  }

  if (trimmedCommand === 'help') {
    return 'Commands: help, clear, echo <text>. JavaScript expressions also work.'
  }

  if (trimmedCommand.startsWith('echo ')) {
    return trimmedCommand.slice(5)
  }

  try {
    const evaluate = Function(`"use strict"; return (${trimmedCommand})`)
    return formatValue(evaluate())
  } catch (error) {
    return error instanceof Error ? `${error.name}: ${error.message}` : String(error)
  }
}

function App() {
  const [entries, setEntries] = useState<readonly TerminalEntry[]>([])
  const [command, setCommand] = useState('')
  const [historyIndex, setHistoryIndex] = useState<number | null>(null)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (command.trim() === 'clear') {
      setEntries([])
      setCommand('')
      setHistoryIndex(null)
      return
    }

    setEntries((currentEntries) => [
      ...currentEntries,
      {
        id: currentEntries.length,
        command,
        output: runCommand(command),
      },
    ])
    setCommand('')
    setHistoryIndex(null)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    const commands = entries.map((entry) => entry.command).filter(Boolean)

    if (commands.length === 0) {
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      const nextIndex =
        historyIndex === null ? commands.length - 1 : Math.max(0, historyIndex - 1)
      setHistoryIndex(nextIndex)
      setCommand(commands[nextIndex])
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()

      if (historyIndex === null || historyIndex === commands.length - 1) {
        setHistoryIndex(null)
        setCommand('')
        return
      }

      const nextIndex = historyIndex + 1
      setHistoryIndex(nextIndex)
      setCommand(commands[nextIndex])
    }
  }

  return (
    <main className="terminal" aria-label="Terminal prompt">
      {entries.map((entry) => (
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
          value={command}
          onChange={(event) => setCommand(event.currentTarget.value)}
          onKeyDown={handleKeyDown}
        />
      </form>
    </main>
  )
}

export default App
