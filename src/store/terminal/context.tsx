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
import {
  createInitialTerminalState,
  terminalReducer,
  type TerminalAction,
} from "./reducer";
import { TerminalContext, type TerminalStore } from "./terminalContext";
import { terminalOutput, toTerminalOutput } from "./output";

// Persistence is fire-and-forget so command handling stays synchronous; a
// failed IndexedDB write only costs durability, not the in-memory state,
// so it's surfaced as a terminal line rather than thrown.
function persistTodos(
  dispatch: (action: TerminalAction) => void,
  todos: readonly string[],
): void {
  storeTodos(todos).catch(() => {
    dispatch({
      type: "appendOutput",
      output: terminalOutput.warning(
        "Warning: could not save tasks to local storage.",
      ),
    });
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
    () => subscribeTodos((todos) => dispatch({ type: "applyTodos", todos })),
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
    dispatch({
      type: "cancelPending",
      output: terminalOutput.text(describeCancellation(pending.label)),
    });
    return true;
  }

  const store = useMemo<TerminalStore>(
    () => ({
      state,
      setCommand(command) {
        dispatch({ type: "setCommand", command });
      },
      submitCommand() {
        const trimmed = state.command.trim();
        cancelPendingOperation();

        if (isGitHubCommand(trimmed)) {
          dispatch({
            type: "submit",
            command: state.command,
            output: undefined,
            todos: state.todos,
            view: state.view,
            pending: true,
          });

          const controller = new AbortController();
          githubOperationRef.current = { controller, label: trimmed };

          void runGitHubCommand(trimmed, {
            getTodos: () => todosRef.current,
            emit: (output, options) =>
              dispatch(
                options?.replace
                  ? {
                      type: "replaceLastOutput",
                      output: toTerminalOutput(output),
                    }
                  : { type: "appendOutput", output: toTerminalOutput(output) },
              ),
            applyTodos: (todos) => {
              persistTodos(dispatch, todos);
              dispatch({ type: "applyTodos", todos });
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
              dispatch({ type: "endPending" });
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
        dispatch({
          type: "submit",
          command: state.command,
          output:
            result.output === undefined
              ? undefined
              : toTerminalOutput(result.output),
          todos: result.nextTodos,
          view: result.view ?? state.view,
          pending: false,
        });
      },
      navigateHistory(direction) {
        dispatch({ type: "navigateHistory", direction });
      },
      cancelCommand() {
        if (cancelPendingOperation()) {
          return;
        }
        dispatch({ type: "cancel" });
      },
      clearScreen() {
        dispatch({ type: "clearScreen" });
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
