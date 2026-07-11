import {
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type PropsWithChildren,
} from "react";
import { isGitHubCommand, runGitHubCommand } from "../github/commands";
import { runTodoCommand } from "../todos/commands";
import { loadStoredTodos, storeTodos } from "../todos/storage";
import { terminalActions } from "./actions";
import { createInitialTerminalState, terminalReducer } from "./reducer";
import { TerminalContext, type TerminalStore } from "./terminalContext";

export function TerminalProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(terminalReducer, undefined, () =>
    createInitialTerminalState(loadStoredTodos()),
  );

  // GitHub commands resolve asynchronously; the ref keeps getTodos current
  // instead of reading the todos captured when the command was submitted.
  const todosRef = useRef(state.todos);
  useEffect(() => {
    todosRef.current = state.todos;
  }, [state.todos]);
  const githubBusyRef = useRef(false);

  const store = useMemo<TerminalStore>(
    () => ({
      state,
      setCommand(command) {
        dispatch(terminalActions.setCommand(command));
      },
      submitCommand() {
        const trimmed = state.command.trim();

        if (isGitHubCommand(trimmed)) {
          dispatch(
            terminalActions.submit(
              state.command,
              undefined,
              state.todos,
              state.view,
            ),
          );

          if (githubBusyRef.current) {
            dispatch(
              terminalActions.appendOutput(
                "Error: a sync operation is already running.",
              ),
            );
            return;
          }

          githubBusyRef.current = true;
          void runGitHubCommand(trimmed, {
            getTodos: () => todosRef.current,
            emit: (output) => dispatch(terminalActions.appendOutput(output)),
            applyTodos: (todos) => {
              storeTodos(todos);
              dispatch(terminalActions.applyTodos(todos));
            },
            clientId: import.meta.env.VITE_GITHUB_CLIENT_ID,
          }).finally(() => {
            githubBusyRef.current = false;
          });
          return;
        }

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
