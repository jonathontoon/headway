import type { TerminalAction } from "./actions";
import type { TerminalState } from "./types";
import {
  formatBootMessage,
  getLocalDate,
  getTimeGreeting,
} from "../todos/summary";

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
    case "clear":
      return {
        ...state,
        entries: [],
        command: "",
        historyIndex: null,
      };
    case "submit":
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
    case "setCommand":
      return {
        ...state,
        command: action.command,
      };
    case "navigateHistory":
      return navigateHistory(state, action.direction);
  }

  const _exhaustive: never = action;
  return _exhaustive;
}
