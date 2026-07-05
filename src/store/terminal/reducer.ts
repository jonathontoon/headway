import { terminalActionTypes, type TerminalAction } from "./actions";
import type { TerminalState } from "./types";

export const initialTerminalState: TerminalState = {
  entries: [],
  command: "",
  historyIndex: null,
};

function getCommandHistory(state: TerminalState): readonly string[] {
  return state.entries.map((entry) => entry.command).filter(Boolean);
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
      return initialTerminalState;
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
      };
    case terminalActionTypes.setCommand:
      return {
        ...state,
        command: action.command,
      };
    case terminalActionTypes.navigateHistory:
      return navigateHistory(state, action.direction);
    default:
      return state;
  }
}
