import { useMemo, useReducer, type PropsWithChildren } from "react";
import { runTodoCommand } from "../todos/commands";
import { loadStoredTodos, storeTodos } from "../todos/storage";
import { terminalActions } from "./actions";
import { createInitialTerminalState, terminalReducer } from "./reducer";
import { TerminalContext, type TerminalStore } from "./terminalContext";

export function TerminalProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(terminalReducer, undefined, () =>
    createInitialTerminalState(loadStoredTodos()),
  );

  const store = useMemo<TerminalStore>(
    () => ({
      state,
      setCommand(command) {
        dispatch(terminalActions.setCommand(command));
      },
      submitCommand() {
        const result = runTodoCommand(state.command, {
          todos: state.todos,
          view: state.view,
        });
        if (result.nextTodos !== state.todos) {
          storeTodos(result.nextTodos);
        }
        dispatch(
          terminalActions.submit(
            state.command,
            result.output,
            result.nextTodos,
            result.view ?? state.view,
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
    [state],
  );

  return (
    <TerminalContext.Provider value={store}>
      {children}
    </TerminalContext.Provider>
  );
}
