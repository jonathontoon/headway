import {
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type PropsWithChildren,
} from "react";
import { isGitHubCommand, runGitHubCommand } from "../github/commands";
import { runTodoCommand } from "../todos/commands";
import { storeTodos, subscribeTodos } from "../todos/storage";
import { terminalActions } from "./actions";
import { createInitialTerminalState, terminalReducer } from "./reducer";
import { TerminalContext, type TerminalStore } from "./terminalContext";
import { terminalOutput, toTerminalOutput } from "./output";

// Persistence is fire-and-forget so command handling stays synchronous; a
// failed IndexedDB write only costs durability, not the in-memory state,
// so it's surfaced as a terminal line rather than thrown.
function persistTodos(
  dispatch: (action: ReturnType<typeof terminalActions.appendOutput>) => void,
  todos: readonly string[],
): void {
  storeTodos(todos).catch(() => {
    dispatch(
      terminalActions.appendOutput(
        terminalOutput.warning(
          "Warning: could not save tasks to local storage.",
        ),
      ),
    );
  });
}

function describeCancellation(label: string): string {
  if (label === "connect") {
    return "Connection cancelled, stopped waiting for authorization.";
  }
  return `${label} cancelled.`;
}

type TerminalProviderProps = PropsWithChildren<{
  readonly initialTodos: readonly string[];
}>;

function useTerminalController(initialTodos: readonly string[]): TerminalStore {
  const [state, dispatch] = useReducer(terminalReducer, undefined, () =>
    createInitialTerminalState(initialTodos),
  );

  // GitHub commands resolve asynchronously; the ref keeps getTodos current
  // instead of reading the todos captured when the command was submitted.
  const todosRef = useRef(state.todos);
  useEffect(() => {
    todosRef.current = state.todos;
  }, [state.todos]);
  // Another tab writing todos broadcasts them here (never in the tab that
  // wrote); adopting its version keeps two open tabs from silently
  // clobbering each other's tasks on the next command.
  useEffect(
    () =>
      subscribeTodos((todos) => dispatch(terminalActions.applyTodos(todos))),
    [],
  );

  // Tracks a github command currently in flight (e.g. the login device-flow
  // poll), so submitting another command can cancel it instead of blocking.
  const githubOperationRef = useRef<{
    readonly controller: AbortController;
    readonly label: string;
  } | null>(null);
  const restoreConfirmationRef = useRef<string | undefined>(undefined);

  function cancelPendingOperation(): boolean {
    const pending = githubOperationRef.current;
    if (!pending) {
      return false;
    }

    pending.controller.abort();
    githubOperationRef.current = null;
    dispatch(
      terminalActions.cancelPending(
        terminalOutput.text(describeCancellation(pending.label)),
      ),
    );
    return true;
  }

  const store = useMemo<TerminalStore>(
    () => ({
      state,
      setCommand(command) {
        dispatch(terminalActions.setCommand(command));
      },
      submitCommand() {
        const trimmed = state.command.trim();
        cancelPendingOperation();

        if (isGitHubCommand(trimmed)) {
          dispatch(
            terminalActions.submit(
              state.command,
              undefined,
              state.todos,
              state.view,
              true,
            ),
          );

          const controller = new AbortController();
          githubOperationRef.current = { controller, label: trimmed };

          void runGitHubCommand(trimmed, {
            getTodos: () => todosRef.current,
            emit: (output, options) =>
              dispatch(
                options?.replace
                  ? terminalActions.replaceLastOutput(toTerminalOutput(output))
                  : terminalActions.appendOutput(toTerminalOutput(output)),
              ),
            applyTodos: (todos) => {
              persistTodos(dispatch, todos);
              dispatch(terminalActions.applyTodos(todos));
            },
            clientId: import.meta.env.VITE_GITHUB_CLIENT_ID,
            restoreConfirmation: {
              get: () => restoreConfirmationRef.current,
              set: (key) => {
                restoreConfirmationRef.current = key;
              },
            },
            signal: controller.signal,
          }).finally(() => {
            if (githubOperationRef.current?.controller === controller) {
              githubOperationRef.current = null;
              dispatch(terminalActions.endPending());
            }
          });
          return;
        }

        const result = runTodoCommand(state.command, {
          todos: state.todos,
          view: state.view,
        });
        if (result.nextTodos !== state.todos) {
          persistTodos(dispatch, result.nextTodos);
        }
        dispatch(
          terminalActions.submit(
            state.command,
            result.output === undefined
              ? undefined
              : toTerminalOutput(result.output),
            result.nextTodos,
            result.view ?? state.view,
            false,
          ),
        );
      },
      navigateHistory(direction) {
        dispatch(terminalActions.navigateHistory(direction));
      },
      cancelCommand() {
        if (cancelPendingOperation()) {
          return;
        }
        dispatch(terminalActions.cancel());
      },
      clearScreen() {
        dispatch(terminalActions.clearScreen());
      },
    }),
    [state],
  );

  return store;
}

export function TerminalProvider({
  children,
  initialTodos,
}: TerminalProviderProps) {
  const store = useTerminalController(initialTodos);

  return (
    <TerminalContext.Provider value={store}>
      {children}
    </TerminalContext.Provider>
  );
}
