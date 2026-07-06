import { useMemo, useReducer, type PropsWithChildren } from "react";
import { useTheme } from "../theme/themeContext";
import { handleThemeCommand } from "../theme/themeCommand";
import { runTodoCommand } from "../todos/commands";
import { loadStoredTodos, storeTodos } from "../todos/storage";
import { terminalActions } from "./actions";
import { createInitialTerminalState, terminalReducer } from "./reducer";
import { TerminalContext, type TerminalStore } from "./terminalContext";

export function TerminalProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(terminalReducer, undefined, () =>
    createInitialTerminalState(loadStoredTodos()),
  );
  const { theme, themes, setTheme } = useTheme();

  const store = useMemo<TerminalStore>(
    () => ({
      state,
      setCommand(command) {
        dispatch(terminalActions.setCommand(command));
      },
      submitCommand() {
        const cmd = state.command.trim();

        if (cmd === "theme" || cmd.startsWith("theme ")) {
          const output = handleThemeCommand(cmd, {
            themes,
            currentTheme: theme,
            setTheme,
          });
          dispatch(terminalActions.submit(state.command, output, state.todos));
          return;
        }

        const result = runTodoCommand(state.command, { todos: state.todos });
        if (result.nextTodos !== state.todos) {
          storeTodos(result.nextTodos);
        }
        dispatch(
          terminalActions.submit(
            state.command,
            result.output,
            result.nextTodos,
          ),
        );
      },
      navigateHistory(direction) {
        dispatch(terminalActions.navigateHistory(direction));
      },
      cancelCommand() {
        dispatch(terminalActions.cancel());
      },
      clearScreen() {
        dispatch(terminalActions.clearScreen());
      },
    }),
    [state, theme, themes, setTheme],
  );

  return (
    <TerminalContext.Provider value={store}>
      {children}
    </TerminalContext.Provider>
  );
}
