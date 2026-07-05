import { terminalActionTypes, type TerminalAction } from "./actions";
import type { TerminalState } from "./types";
import { SAMPLE_TODOS } from "../todos/storage";
import {
  formatBootMessage,
  getLocalDate,
  getTimeGreeting,
} from "../todos/summary";

export const initialTerminalState: TerminalState = {
  entries: [
    {
      id: 0,
      output: formatBootMessage(
        SAMPLE_TODOS,
        getLocalDate(),
        getTimeGreeting(),
      ),
    },
  ],
  command: "",
  historyIndex: null,
  todos: SAMPLE_TODOS,
};

export function createInitialTerminalState(
  todos: readonly string[],
): TerminalState {
  return {
    entries: [
      {
        id: 0,
        output: formatBootMessage(todos, getLocalDate(), getTimeGreeting()),
      },
    ],
    command: "",
    historyIndex: null,
    todos,
  };
}

function getCommandHistory(state: TerminalState): readonly string[] {
  return state.entries
    .map((entry) => entry.command)
    .filter((command): command is string => Boolean(command));
}

function navigateHistory(
  state: TerminalState,
  direction: "previous" | "next",
): TerminalState {
  const commands = getCommandHistory(state);

  if (commands.length === 0) {
    return state;
  }

  if (direction === "previous") {
    const nextIndex =
      state.historyIndex === null
        ? commands.length - 1
        : Math.max(0, state.historyIndex - 1);

    return {
      ...state,
      historyIndex: nextIndex,
      command: commands[nextIndex],
    };
  }

  if (
    state.historyIndex === null ||
    state.historyIndex === commands.length - 1
  ) {
    return {
      ...state,
      historyIndex: null,
      command: "",
    };
  }

  const nextIndex = state.historyIndex + 1;

  return {
    ...state,
    historyIndex: nextIndex,
    command: commands[nextIndex],
  };
}

export function terminalReducer(
  state: TerminalState,
  action: TerminalAction,
): TerminalState {
  switch (action.type) {
    case terminalActionTypes.clear:
      return {
        ...initialTerminalState,
        entries: [],
        todos: state.todos,
      };
    case terminalActionTypes.submit:
      return {
        ...state,
        entries: [
          ...state.entries,
          {
            id: state.entries.length,
            command: action.command,
            output: action.output,
          },
        ],
        command: "",
        historyIndex: null,
        todos: action.todos,
      };
    case terminalActionTypes.setCommand:
      return {
        ...state,
        command: action.command,
      };
    case terminalActionTypes.navigateHistory:
      return navigateHistory(state, action.direction);
    case terminalActionTypes.hydrateTodos:
      return {
        ...state,
        todos: action.todos,
        entries:
          state.entries.length === 0
            ? state.entries
            : createInitialTerminalState(action.todos).entries,
      };
    default:
      return state;
  }
}
