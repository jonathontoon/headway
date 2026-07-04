import { useMemo, useReducer, type PropsWithChildren } from 'react'
import { terminalActions } from '../actions/terminalActions'
import { runCommand } from '../services/terminalCommands'
import {
  initialTerminalState,
  terminalReducer,
} from '../reducers/terminalReducer'
import { TerminalContext, type TerminalStore } from './TerminalContext'

export function TerminalProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(terminalReducer, initialTerminalState)

  const store = useMemo<TerminalStore>(
    () => ({
      state,
      setCommand(command) {
        dispatch(terminalActions.setCommand(command))
      },
      submitCommand() {
        if (state.command.trim() === 'clear') {
          dispatch(terminalActions.clear())
          return
        }

        dispatch(
          terminalActions.submit(state.command, runCommand(state.command)),
        )
      },
      navigateHistory(direction) {
        dispatch(terminalActions.navigateHistory(direction))
      },
    }),
    [state],
  )

  return (
    <TerminalContext.Provider value={store}>
      {children}
    </TerminalContext.Provider>
  )
}
