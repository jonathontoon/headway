import type { TerminalOutput } from "./output";
import type { TerminalState } from "./types";
import {
  formatBootMessage,
  getLocalDate,
  getTimeGreeting,
} from "../todos/summary";

export type TerminalAction =
  | { readonly type: "clearScreen" }
  | { readonly type: "cancel" }
  | { readonly type: "endPending" }
  | { readonly type: "cancelPending"; readonly output: TerminalOutput }
  | {
      readonly type: "submit";
      readonly command: string;
      readonly output?: TerminalOutput | undefined;
      readonly todos: readonly string[];
      readonly view: readonly number[];
      readonly pending: boolean;
    }
  | { readonly type: "appendOutput"; readonly output: TerminalOutput }
  | { readonly type: "replaceLastOutput"; readonly output: TerminalOutput }
  | { readonly type: "applyTodos"; readonly todos: readonly string[] }
  | { readonly type: "setCommand"; readonly command: string }
  | {
      readonly type: "navigateHistory";
      readonly direction: "previous" | "next";
    };

export function createInitialTerminalState(
  todos: readonly string[],
): TerminalState {
  const { message, view } = formatBootMessage(
    todos,
    getLocalDate(),
    getTimeGreeting(),
  );

  return {
    entries: [{ id: 0, output: message }],
    command: "",
    historyIndex: null,
    todos,
    view,
    pending: false,
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
      command: commands[nextIndex] ?? "",
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
    command: commands[nextIndex] ?? "",
  };
}

export function terminalReducer(
  state: TerminalState,
  action: TerminalAction,
): TerminalState {
  switch (action.type) {
    case "clearScreen":
      return {
        ...state,
        entries: [],
      };
    case "cancel":
      return {
        ...state,
        entries: [
          ...state.entries,
          {
            id: state.entries.length,
            command: `${state.command}^C`,
          },
        ],
        command: "",
        historyIndex: null,
      };
    case "endPending":
      return { ...state, pending: false };
    case "cancelPending":
      return {
        ...state,
        pending: false,
        entries: [
          ...state.entries,
          { id: state.entries.length, output: action.output },
        ],
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
        view: action.view,
        pending: action.pending,
      };
    case "appendOutput":
      return {
        ...state,
        entries: [
          ...state.entries,
          {
            id: state.entries.length,
            output: action.output,
          },
        ],
      };
    case "replaceLastOutput": {
      const lastIndex = state.entries.length - 1;
      if (lastIndex < 0) {
        return state;
      }
      return {
        ...state,
        entries: state.entries.map((entry, index) =>
          index === lastIndex ? { ...entry, output: action.output } : entry,
        ),
      };
    }
    case "applyTodos":
      return {
        ...state,
        todos: action.todos,
        view: [],
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
