import { describe, expect, it } from 'vitest'
import { terminalActions } from '../actions/terminalActions'
import type { TerminalState } from '../types/terminal'
import { initialTerminalState, terminalReducer } from './terminalReducer'

describe('terminalReducer', () => {
  it('sets the current command', () => {
    expect(
      terminalReducer(initialTerminalState, terminalActions.setCommand('help')),
    ).toEqual({
      entries: [],
      command: 'help',
      historyIndex: null,
    })
  })

  it('appends submitted commands and resets transient input state', () => {
    const state: TerminalState = {
      entries: [],
      command: 'help',
      historyIndex: 0,
    }

    expect(
      terminalReducer(state, terminalActions.submit('help', 'Commands')),
    ).toEqual({
      entries: [
        {
          id: 0,
          command: 'help',
          output: 'Commands',
        },
      ],
      command: '',
      historyIndex: null,
    })
  })

  it('clears entries and input state', () => {
    const state: TerminalState = {
      entries: [
        {
          id: 0,
          command: 'echo hello',
          output: 'hello',
        },
      ],
      command: 'clear',
      historyIndex: 0,
    }

    expect(terminalReducer(state, terminalActions.clear())).toEqual(
      initialTerminalState,
    )
  })

  it('navigates backward and forward through command history', () => {
    const state: TerminalState = {
      entries: [
        { id: 0, command: 'echo first', output: 'first' },
        { id: 1, command: 'echo second', output: 'second' },
      ],
      command: '',
      historyIndex: null,
    }

    const latest = terminalReducer(
      state,
      terminalActions.navigateHistory('previous'),
    )
    expect(latest.command).toBe('echo second')
    expect(latest.historyIndex).toBe(1)

    const previous = terminalReducer(
      latest,
      terminalActions.navigateHistory('previous'),
    )
    expect(previous.command).toBe('echo first')
    expect(previous.historyIndex).toBe(0)

    const next = terminalReducer(
      previous,
      terminalActions.navigateHistory('next'),
    )
    expect(next.command).toBe('echo second')
    expect(next.historyIndex).toBe(1)

    const blank = terminalReducer(next, terminalActions.navigateHistory('next'))
    expect(blank.command).toBe('')
    expect(blank.historyIndex).toBeNull()
  })

  it('does not change state when history is empty', () => {
    expect(
      terminalReducer(
        initialTerminalState,
        terminalActions.navigateHistory('previous'),
      ),
    ).toBe(initialTerminalState)
  })
})
