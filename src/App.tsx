import { useMemo, useReducer, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type LogEntry = {
  id: number
  command: string
  output: string
  tone: 'info' | 'success' | 'warning'
}

type TerminalState = {
  cwd: string
  history: LogEntry[]
  variables: Record<string, string>
  commandCount: number
}

type TerminalAction =
  | { type: 'execute'; command: string }
  | { type: 'clear' }
  | { type: 'hydrate'; snapshot: TerminalState }

const initialTerminalState: TerminalState = {
  cwd: '~/prototype',
  commandCount: 0,
  variables: {
    mode: 'prototype',
    stack: 'React + reducer store',
  },
  history: [
    {
      id: 0,
      command: 'boot',
      output:
        'REPL store mounted. Try help, state, set theme neon, echo hello, pwd, or clear.',
      tone: 'success',
    },
  ],
}

const createLogEntry = (
  id: number,
  command: string,
  output: string,
  tone: LogEntry['tone'] = 'info',
): LogEntry => ({ id, command, output, tone })

const evaluateCommand = (
  command: string,
  state: TerminalState,
): Pick<LogEntry, 'output' | 'tone'> &
  Partial<Pick<TerminalState, 'cwd' | 'variables'>> => {
  const [program = '', ...args] = command.trim().split(/\s+/)

  switch (program.toLowerCase()) {
    case 'help':
      return {
        output:
          'Commands: help, state, history, pwd, cd <path>, set <key> <value>, echo <message>, clear.',
        tone: 'success',
      }
    case 'state':
      return {
        output: JSON.stringify(
          {
            cwd: state.cwd,
            variables: state.variables,
            commandCount: state.commandCount,
          },
          null,
          2,
        ),
        tone: 'info',
      }
    case 'history':
      return {
        output: state.history
          .map((entry) => `${entry.id}: ${entry.command}`)
          .join('\n'),
        tone: 'info',
      }
    case 'pwd':
      return { output: state.cwd, tone: 'info' }
    case 'cd': {
      const nextPath = args.join(' ') || '~'
      return {
        cwd: nextPath,
        output: `Changed directory to ${nextPath}`,
        tone: 'success',
      }
    }
    case 'set': {
      const [key, ...valueParts] = args
      if (!key || valueParts.length === 0) {
        return {
          output: 'Usage: set <key> <value>',
          tone: 'warning',
        }
      }

      const value = valueParts.join(' ')
      return {
        variables: { ...state.variables, [key]: value },
        output: `Stored ${key}=${value}`,
        tone: 'success',
      }
    }
    case 'echo':
      return { output: args.join(' ') || ' ', tone: 'info' }
    case '':
      return { output: 'Enter a command or type help.', tone: 'warning' }
    default:
      return {
        output: `${program}: command not found. Type help for available actions.`,
        tone: 'warning',
      }
  }
}

const terminalReducer = (
  state: TerminalState,
  action: TerminalAction,
): TerminalState => {
  switch (action.type) {
    case 'hydrate':
      return action.snapshot
    case 'clear':
      return {
        ...state,
        history: [
          createLogEntry(
            state.commandCount + 1,
            'clear',
            'History cleared. Store state is still available via state.',
            'success',
          ),
        ],
        commandCount: state.commandCount + 1,
      }
    case 'execute': {
      if (action.command.trim().toLowerCase() === 'clear') {
        return terminalReducer(state, { type: 'clear' })
      }

      const evaluation = evaluateCommand(action.command, state)
      const nextCount = state.commandCount + 1

      return {
        cwd: evaluation.cwd ?? state.cwd,
        variables: evaluation.variables ?? state.variables,
        commandCount: nextCount,
        history: [
          ...state.history,
          createLogEntry(
            nextCount,
            action.command,
            evaluation.output,
            evaluation.tone,
          ),
        ],
      }
    }
    default:
      return state
  }
}

const useTerminalStore = () => {
  const [state, dispatch] = useReducer(terminalReducer, initialTerminalState)

  const actions = useMemo(
    () => ({
      execute: (command: string) => dispatch({ type: 'execute', command }),
      clear: () => dispatch({ type: 'clear' }),
      hydrate: (snapshot: TerminalState) =>
        dispatch({ type: 'hydrate', snapshot }),
    }),
    [],
  )

  return { state, actions }
}

function App() {
  const { state, actions } = useTerminalStore()
  const [draftCommand, setDraftCommand] = useState('')

  const submitCommand = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    actions.execute(draftCommand)
    setDraftCommand('')
  }

  return (
    <main className="terminal-shell" aria-labelledby="terminal-title">
      <section className="terminal-hero">
        <p className="eyebrow">Reducer-driven REPL prototype</p>
        <h1 id="terminal-title">Headway Terminal</h1>
        <p>
          A browser REPL mockup powered by explicit actions, a reducer, and a
          small component-level store.
        </p>
      </section>

      <section className="terminal-window" aria-label="Interactive terminal">
        <header className="terminal-toolbar">
          <div className="window-controls" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <div className="terminal-meta">
            <span>{state.cwd}</span>
            <span>{state.commandCount} actions</span>
          </div>
        </header>

        <div className="terminal-output" role="log" aria-live="polite">
          {state.history.map((entry) => (
            <article className={`terminal-entry ${entry.tone}`} key={entry.id}>
              <p className="prompt-line">
                <span className="prompt">λ</span> {entry.command}
              </p>
              <pre>{entry.output}</pre>
            </article>
          ))}
        </div>

        <form className="terminal-input" onSubmit={submitCommand}>
          <label htmlFor="command-input">Command</label>
          <span aria-hidden="true">λ</span>
          <input
            id="command-input"
            autoComplete="off"
            value={draftCommand}
            onChange={(event) => setDraftCommand(event.target.value)}
            placeholder="Type help and press Enter"
          />
          <button type="submit">Run</button>
        </form>
      </section>

      <aside className="store-panel" aria-label="Store snapshot">
        <h2>Store snapshot</h2>
        <dl>
          <div>
            <dt>Current path</dt>
            <dd>{state.cwd}</dd>
          </div>
          <div>
            <dt>Variables</dt>
            <dd>{Object.keys(state.variables).length}</dd>
          </div>
          <div>
            <dt>Actions reduced</dt>
            <dd>{state.commandCount}</dd>
          </div>
        </dl>
        <button type="button" onClick={actions.clear}>
          Dispatch clear action
        </button>
      </aside>
    </main>
  )
}

export default App
