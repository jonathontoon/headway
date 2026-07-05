import { useMemo, useReducer, type PropsWithChildren } from 'react'
import { useTheme } from '../theme/themeContext'
import { handleThemeCommand } from '../theme/themeCommand'
import { terminalActions } from './actions'
import { runCommand } from './commands'
import { initialTerminalState, terminalReducer } from './reducer'
import { TerminalContext, type TerminalStore } from './terminalContext'

export function TerminalProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(terminalReducer, initialTerminalState)
  const { theme, themes, setTheme, importTheme } = useTheme()

  const store = useMemo<TerminalStore>(
    () => ({
      state,
      setCommand(command) {
        dispatch(terminalActions.setCommand(command))
      },
      submitCommand() {
        const cmd = state.command.trim()

        if (cmd === 'clear') {
          dispatch(terminalActions.clear())
          return
        }

        if (cmd === 'theme' || cmd.startsWith('theme ')) {
          const output = handleThemeCommand(cmd, {
            themes,
            currentTheme: theme,
            setTheme,
            importTheme,
          })
          dispatch(terminalActions.submit(state.command, output))
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
    [state, theme, themes, setTheme, importTheme],
  )

  return (
    <TerminalContext.Provider value={store}>
      {children}
    </TerminalContext.Provider>
  )
}
