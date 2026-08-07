import type { TerminalOutput } from "./output";
import type { TerminalState } from "./types";
import {
  formatBootMessage,
  getLocalDate,
  getTimeGreeting,
} from "../todos/summary";

export const TERMINAL_ACTION_TYPE = {
  CLEAR_SCREEN: "CLEAR_SCREEN",
  CANCEL: "CANCEL",
  END_PENDING: "END_PENDING",
  CANCEL_PENDING: "CANCEL_PENDING",
  SUBMIT: "SUBMIT",
  APPEND_OUTPUT: "APPEND_OUTPUT",
  REPLACE_LAST_OUTPUT: "REPLACE_LAST_OUTPUT",
  APPLY_TODOS: "APPLY_TODOS",
  SET_COMMAND: "SET_COMMAND",
  NAVIGATE_HISTORY: "NAVIGATE_HISTORY",
} as const;

export type TerminalActionType =
  (typeof TERMINAL_ACTION_TYPE)[keyof typeof TERMINAL_ACTION_TYPE];

export type TerminalAction =
  | { readonly type: typeof TERMINAL_ACTION_TYPE.CLEAR_SCREEN }
  | { readonly type: typeof TERMINAL_ACTION_TYPE.CANCEL }
  | { readonly type: typeof TERMINAL_ACTION_TYPE.END_PENDING }
  | {
      readonly type: typeof TERMINAL_ACTION_TYPE.CANCEL_PENDING;
      readonly output: TerminalOutput;
    }
  | {
      readonly type: typeof TERMINAL_ACTION_TYPE.SUBMIT;
      readonly command: string;
      readonly output?: TerminalOutput | undefined;
      readonly todos: readonly string[];
      readonly view: readonly number[];
      readonly pending: boolean;
    }
  | {
      readonly type: typeof TERMINAL_ACTION_TYPE.APPEND_OUTPUT;
      readonly output: TerminalOutput;
    }
  | {
      readonly type: typeof TERMINAL_ACTION_TYPE.REPLACE_LAST_OUTPUT;
      readonly output: TerminalOutput;
    }
  | {
      readonly type: typeof TERMINAL_ACTION_TYPE.APPLY_TODOS;
      readonly todos: readonly string[];
    }
  | {
      readonly type: typeof TERMINAL_ACTION_TYPE.SET_COMMAND;
      readonly command: string;
    }
  | {
      readonly type: typeof TERMINAL_ACTION_TYPE.NAVIGATE_HISTORY;
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
    case TERMINAL_ACTION_TYPE.CLEAR_SCREEN:
      return {
        ...state,
        entries: [],
      };
    case TERMINAL_ACTION_TYPE.CANCEL:
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
    case TERMINAL_ACTION_TYPE.END_PENDING:
      return { ...state, pending: false };
    case TERMINAL_ACTION_TYPE.CANCEL_PENDING:
      return {
        ...state,
        pending: false,
        entries: [
          ...state.entries,
          { id: state.entries.length, output: action.output },
        ],
      };
    case TERMINAL_ACTION_TYPE.SUBMIT:
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
    case TERMINAL_ACTION_TYPE.APPEND_OUTPUT:
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
    case TERMINAL_ACTION_TYPE.REPLACE_LAST_OUTPUT: {
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
    case TERMINAL_ACTION_TYPE.APPLY_TODOS:
      return {
        ...state,
        todos: action.todos,
        view: [],
      };
    case TERMINAL_ACTION_TYPE.SET_COMMAND:
      return {
        ...state,
        command: action.command,
      };
    case TERMINAL_ACTION_TYPE.NAVIGATE_HISTORY:
      return navigateHistory(state, action.direction);
  }

  const _exhaustive: never = action;
  return _exhaustive;
}
