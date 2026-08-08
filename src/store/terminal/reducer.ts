import type { TerminalOutput } from "./output";
import { Direction } from "./direction";
import type { TerminalState } from "./types";
import {
  formatBootMessage,
  getLocalDate,
  getTimeGreeting,
} from "../todos/summary";

/** Terminal reducer action names. */
export const ACTION_TYPE = {
  CLEAR_SCREEN: "CLEAR_SCREEN",
  CANCEL: "CANCEL",
  END_PENDING: "END_PENDING",
  CANCEL_PENDING: "CANCEL_PENDING",
  SUBMIT: "SUBMIT",
  APPEND_OUTPUT: "APPEND_OUTPUT",
  REPLACE_LAST_OUTPUT: "REPLACE_LAST_OUTPUT",
  SET_COMMAND: "SET_COMMAND",
  NAVIGATE_HISTORY: "NAVIGATE_HISTORY",
} as const;

/** Supported terminal reducer action name. */
export type TerminalActionType = (typeof ACTION_TYPE)[keyof typeof ACTION_TYPE];

/** All actions accepted by the terminal reducer. */
export type TerminalAction =
  | { readonly type: typeof ACTION_TYPE.CLEAR_SCREEN }
  | { readonly type: typeof ACTION_TYPE.CANCEL }
  | { readonly type: typeof ACTION_TYPE.END_PENDING }
  | {
      readonly type: typeof ACTION_TYPE.CANCEL_PENDING;
      readonly output: TerminalOutput;
    }
  | {
      readonly type: typeof ACTION_TYPE.SUBMIT;
      readonly command: string;
      readonly output?: TerminalOutput | undefined;
      readonly view: readonly number[];
      readonly pending: boolean;
    }
  | {
      readonly type: typeof ACTION_TYPE.APPEND_OUTPUT;
      readonly output: TerminalOutput;
    }
  | {
      readonly type: typeof ACTION_TYPE.REPLACE_LAST_OUTPUT;
      readonly output: TerminalOutput;
    }
  | {
      readonly type: typeof ACTION_TYPE.SET_COMMAND;
      readonly command: string;
    }
  | {
      readonly type: typeof ACTION_TYPE.NAVIGATE_HISTORY;
      readonly direction: Direction;
    };

/**
 * Creates terminal state with the boot summary as the first entry.
 *
 * @param todos - Current todo lines used to build the boot summary.
 * @returns Initial terminal reducer state.
 */
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
  direction: Direction,
): TerminalState {
  const commands = getCommandHistory(state);

  if (commands.length === 0) {
    return state;
  }

  if (direction === Direction.Previous) {
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

/**
 * Applies a terminal action to state.
 *
 * @param state - Current terminal state.
 * @param action - Action to apply.
 * @returns Updated terminal state.
 */
export function terminalReducer(
  state: TerminalState,
  action: TerminalAction,
): TerminalState {
  switch (action.type) {
    case ACTION_TYPE.CLEAR_SCREEN:
      return {
        ...state,
        entries: [],
      };
    case ACTION_TYPE.CANCEL:
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
    case ACTION_TYPE.END_PENDING:
      return { ...state, pending: false };
    case ACTION_TYPE.CANCEL_PENDING:
      return {
        ...state,
        pending: false,
        entries: [
          ...state.entries,
          { id: state.entries.length, output: action.output },
        ],
      };
    case ACTION_TYPE.SUBMIT:
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
        view: action.view,
        pending: action.pending,
      };
    case ACTION_TYPE.APPEND_OUTPUT:
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
    case ACTION_TYPE.REPLACE_LAST_OUTPUT: {
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
    case ACTION_TYPE.SET_COMMAND:
      return {
        ...state,
        command: action.command,
      };
    case ACTION_TYPE.NAVIGATE_HISTORY:
      return navigateHistory(state, action.direction);
  }

  const _exhaustive: never = action;
  return _exhaustive;
}
