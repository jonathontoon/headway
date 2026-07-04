import { useMemo, useReducer, type PropsWithChildren } from 'react'
import { terminalActions } from './actions'
import { runCommand } from './commands'
import { initialTerminalState, terminalReducer } from './reducer'
import { TerminalContext, type TerminalStore } from './terminalContext'

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
