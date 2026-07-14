import {
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type PropsWithChildren,
} from "react";
import { isGitHubCommand, runGitHubCommand } from "../github/commands";
import { runTodoCommand } from "../todos/commands";
import {
  loadStoredTodos,
  parseStoredTodos,
  storeTodos,
  TODOS_STORAGE_KEY,
} from "../todos/storage";
import { terminalActions } from "./actions";
import { createInitialTerminalState, terminalReducer } from "./reducer";
import { TerminalContext, type TerminalStore } from "./terminalContext";

function describeCancellation(label: string): string {
  if (label === "connect") {
    return "Connection cancelled, stopped waiting for authorization.";
  }
  return `${label} cancelled.`;
}

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
  // Another tab writing todos fires `storage` here (never in the tab that
  // wrote); adopting its version keeps two open tabs from silently
  // clobbering each other's tasks on the next command.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== TODOS_STORAGE_KEY || event.newValue === null) {
        return;
      }

      const todos = parseStoredTodos(event.newValue);
      if (todos) {
        dispatch(terminalActions.applyTodos(todos));
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Tracks a github command currently in flight (e.g. the login device-flow
  // poll), so submitting another command can cancel it instead of blocking.
  const githubOperationRef = useRef<{
    readonly controller: AbortController;
    readonly label: string;
  } | null>(null);

  const store = useMemo<TerminalStore>(
    () => ({
      state,
      setCommand(command) {
        dispatch(terminalActions.setCommand(command));
      },
      submitCommand() {
        const trimmed = state.command.trim();
        const pending = githubOperationRef.current;

        if (pending) {
          pending.controller.abort();
          githubOperationRef.current = null;
          dispatch(
            terminalActions.appendOutput(describeCancellation(pending.label)),
          );
        }

        if (isGitHubCommand(trimmed)) {
          dispatch(
            terminalActions.submit(
              state.command,
              undefined,
              state.todos,
              state.view,
            ),
          );

          const controller = new AbortController();
          githubOperationRef.current = { controller, label: trimmed };

          void runGitHubCommand(trimmed, {
            getTodos: () => todosRef.current,
            emit: (output, options) =>
              dispatch(
                options?.replace
                  ? terminalActions.replaceLastOutput(output)
                  : terminalActions.appendOutput(output),
              ),
            applyTodos: (todos) => {
              storeTodos(todos);
              dispatch(terminalActions.applyTodos(todos));
            },
            clientId: import.meta.env.VITE_GITHUB_CLIENT_ID,
            signal: controller.signal,
          }).finally(() => {
            if (githubOperationRef.current?.controller === controller) {
              githubOperationRef.current = null;
            }
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
