import {
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type PropsWithChildren,
} from "react";
import { isGitHubCommand, runGitHubCommand } from "../github/commands";
import { runTodoCommand } from "../todos/commands";
import { todosStore } from "../todos/persistence";
import {
  createInitialTerminalState,
  ACTION_TYPE,
  terminalReducer,
  type TerminalAction,
} from "./reducer";
import { Direction } from "./direction";
import { TerminalContext, type TerminalStore } from "./context";
import { terminalOutput, toTerminalOutput } from "./output";

// Persistence is fire-and-forget so command handling stays synchronous; a
// failed indexedDB write only costs durability, not the in-memory state,
// so it's surfaced as a terminal line rather than thrown.
function persistTodos(
  dispatch: (action: TerminalAction) => void,
  todos: readonly string[],
): void {
  todosStore.set(todos).catch(() => {
    dispatch({
      type: ACTION_TYPE.APPEND_OUTPUT,
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
  readonly todos: readonly string[];
}>;

function useTerminalController(todos: readonly string[]): TerminalStore {
  const [state, dispatch] = useReducer(terminalReducer, undefined, () =>
    createInitialTerminalState(todos),
  );

  useEffect(() => {
    const hasSameTodos =
      state.todos.length === todos.length &&
      state.todos.every((todo, index) => todo === todos[index]);

    if (!hasSameTodos) {
      dispatch({ type: ACTION_TYPE.APPLY_TODOS, todos });
    }
  }, [state.todos, todos]);

  // GitHub commands resolve asynchronously; the ref keeps getTodos current
  // instead of reading the todos captured when the command was submitted.
  const todosRef = useRef(state.todos);
  useEffect(() => {
    todosRef.current = state.todos;
  }, [state.todos]);

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
      type: ACTION_TYPE.CANCEL_PENDING,
      output: terminalOutput.text(describeCancellation(pending.label)),
    });
    return true;
  }

  const store = useMemo<TerminalStore>(
    () => ({
      state,
      setCommand(command) {
        dispatch({ type: ACTION_TYPE.SET_COMMAND, command });
      },
      submitCommand() {
        const trimmed = state.command.trim();
        cancelPendingOperation();

        if (isGitHubCommand(trimmed)) {
          dispatch({
            type: ACTION_TYPE.SUBMIT,
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
                      type: ACTION_TYPE.REPLACE_LAST_OUTPUT,
                      output: toTerminalOutput(output),
                    }
                  : {
                      type: ACTION_TYPE.APPEND_OUTPUT,
                      output: toTerminalOutput(output),
                    },
              ),
            applyTodos: (todos) => {
              persistTodos(dispatch, todos);
              dispatch({ type: ACTION_TYPE.APPLY_TODOS, todos });
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
              dispatch({ type: ACTION_TYPE.END_PENDING });
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
          type: ACTION_TYPE.SUBMIT,
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
      navigateHistory(direction: Direction) {
        dispatch({
          type: ACTION_TYPE.NAVIGATE_HISTORY,
          direction,
        });
      },
      cancelCommand() {
        if (cancelPendingOperation()) {
          return;
        }
        dispatch({ type: ACTION_TYPE.CANCEL });
      },
      clearScreen() {
        dispatch({ type: ACTION_TYPE.CLEAR_SCREEN });
      },
    }),
    [state],
  );

  return store;
}

export function TerminalProvider({ children, todos }: TerminalProviderProps) {
  const store = useTerminalController(todos);

  return (
    <TerminalContext.Provider value={store}>
      {children}
    </TerminalContext.Provider>
  );
}
