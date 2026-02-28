import {
  createContext,
  startTransition,
  useContext,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import {
  appendEntry,
  clearTerminal,
  navigateHistory,
  recordCommand,
  resolveEntry,
  setInput,
} from "@reducers/terminal/terminalActions";
import { COMMAND_NAMES } from "@reducers/terminal/terminalCatalog";
import {
  createPendingEntry,
  createWelcomeEntry,
  executeCommand,
} from "@reducers/terminal/terminalCommands";
import {
  createTerminalState,
  terminalReducer,
} from "@reducers/terminal/terminalReducer";
import type {
  AutocompleteResult,
  TerminalAction,
  TerminalState,
} from "@reducers/terminal/terminalTypes";
import { useTaskActions, useTasksState } from "@contexts/TaskContext";
import { getVisibleTasks } from "@reducers/tasks/taskSelectors";

const TerminalStateContext = createContext<TerminalState | null>(null);
const TerminalDispatchContext = createContext<Dispatch<TerminalAction> | null>(
  null
);

export const TerminalProvider = ({ children }: { children: ReactNode }) => {
  const taskState = useTasksState();
  const [state, dispatch] = useReducer(terminalReducer, undefined, () =>
    createTerminalState([createWelcomeEntry(taskState)])
  );

  return (
    <TerminalStateContext.Provider value={state}>
      <TerminalDispatchContext.Provider value={dispatch}>
        {children}
      </TerminalDispatchContext.Provider>
    </TerminalStateContext.Provider>
  );
};

export const useTerminalState = (): TerminalState => {
  const state = useContext(TerminalStateContext);
  if (!state) {
    throw new Error("useTerminalState must be used within TerminalProvider");
  }

  return state;
};

const useTerminalDispatch = (): Dispatch<TerminalAction> => {
  const dispatch = useContext(TerminalDispatchContext);
  if (!dispatch) {
    throw new Error("useTerminalDispatch must be used within TerminalProvider");
  }

  return dispatch;
};

export const useTerminalController = () => {
  const state = useTerminalState();
  const dispatch = useTerminalDispatch();
  const taskState = useTasksState();
  const taskActions = useTaskActions();

  return useMemo(
    () => ({
      input: state.input,
      setInput(next: string) {
        dispatch(setInput(next));
      },
      async submit(raw: string) {
        const trimmed = raw.trim();
        if (!trimmed) {
          return;
        }

        const pendingEntry = createPendingEntry(trimmed);
        dispatch(appendEntry(pendingEntry));

        await Promise.resolve();

        const result = executeCommand(trimmed, taskState);

        if (result.clearTerminal) {
          dispatch(clearTerminal());
          return;
        }

        const taskAction = result.taskAction;

        if (taskAction) {
          startTransition(() => {
            taskActions.dispatch(taskAction);
          });
        }

        dispatch(resolveEntry(pendingEntry.id, result.entryStatus, result.events));
        dispatch(recordCommand(trimmed));
      },
      navigateHistory(direction: "up" | "down") {
        dispatch(navigateHistory(direction));
      },
      getAutocomplete(input: string, cursorPos: number): AutocompleteResult | null {
        const textBeforeCursor = input.slice(0, cursorPos);
        const words = textBeforeCursor.split(/\s+/);
        const lastWord = words.at(-1) ?? "";

        if (words.length === 1 && lastWord) {
          const match = COMMAND_NAMES.find((command) =>
            command.startsWith(lastWord.toLowerCase())
          );

          if (match) {
            const suffix = match.slice(lastWord.length);
            return {
              completed: input.slice(0, cursorPos) + suffix + input.slice(cursorPos),
              insertPosition: cursorPos + suffix.length,
            };
          }
        }

        const [command, target] = words;
        if (command?.toLowerCase() === "edit" && target) {
          const visibleTask = getVisibleTasks(taskState).find((task) => {
            if (/^\d+$/.test(target)) {
              return task.visibleIndex === Number.parseInt(target, 10);
            }

            return task.id === target;
          });

          if (visibleTask) {
            const completed = `edit ${target} ${visibleTask.title}`;
            return {
              completed,
              insertPosition: completed.length,
            };
          }
        }

        return null;
      },
    }),
    [dispatch, state.input, taskActions, taskState]
  );
};
