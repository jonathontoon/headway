import type { UnknownAction } from "@reduxjs/toolkit";
import {
  TERMINAL_ACTION_TYPES,
  TERMINAL_PENDING_WARNING,
  TERMINAL_WELCOME_MESSAGE,
} from "../constants";
import { executeCommand } from "../lib/terminal/commands";
import type {
  HistoryDirection,
  TerminalAction,
  TerminalState,
  TerminalTranscriptItem,
  TerminalTranscriptItemContent,
} from "../types";

const createTranscriptItem = (
  nextItemId: number,
  item: TerminalTranscriptItemContent
): TerminalTranscriptItem => ({
  id: nextItemId,
  ...item,
});

const createWelcomeItem = (): TerminalTranscriptItem => ({
  id: 0,
  kind: "text",
  text: TERMINAL_WELCOME_MESSAGE,
});

export const createInitialTerminalState = (): TerminalState => ({
  input: "",
  items: [createWelcomeItem()],
  history: [],
  historyIndex: -1,
  nextItemId: 1,
  pendingCommand: null,
});

const setCurrentInput = (
  state: TerminalState,
  input: string
): TerminalState => ({
  ...state,
  input,
  historyIndex: -1,
});

const getHistoryInput = (
  history: readonly string[],
  historyIndex: number
): string => history[historyIndex] ?? "";

const createTranscriptItems = (
  startId: number,
  items: readonly TerminalTranscriptItemContent[]
): readonly TerminalTranscriptItem[] =>
  items.map((item, index) => createTranscriptItem(startId + index, item));

const appendItems = (
  state: TerminalState,
  items: readonly TerminalTranscriptItemContent[]
): {
  items: readonly TerminalTranscriptItem[];
  nextItemId: number;
  appendedItems: readonly TerminalTranscriptItem[];
} => {
  const appendedItems = createTranscriptItems(state.nextItemId, items);

  return {
    items: [...state.items, ...appendedItems],
    nextItemId: state.nextItemId + appendedItems.length,
    appendedItems,
  };
};

const navigate = (
  state: TerminalState,
  direction: HistoryDirection
): TerminalState => {
  if (state.history.length === 0) {
    return state;
  }

  if (direction === "up") {
    const nextIndex = Math.min(state.historyIndex + 1, state.history.length - 1);

    return {
      ...state,
      historyIndex: nextIndex,
      input: getHistoryInput(state.history, nextIndex),
    };
  }

  const nextIndex = state.historyIndex - 1;
  if (nextIndex < 0) {
    return {
      ...state,
      historyIndex: -1,
      input: "",
    };
  }

  return {
    ...state,
    historyIndex: nextIndex,
    input: getHistoryInput(state.history, nextIndex),
  };
};

const appendCommandWithItems = (
  state: TerminalState,
  commandText: string,
  items: readonly TerminalTranscriptItemContent[]
): TerminalState => {
  const nextState = appendItems(state, [
    { kind: "command", text: commandText },
    ...items,
  ]);

  return {
    ...state,
    input: "",
    items: nextState.items,
    history: [commandText, ...state.history],
    historyIndex: -1,
    nextItemId: nextState.nextItemId,
  };
};

const startPendingCommand = (
  state: TerminalState,
  commandText: string,
  result: Extract<ReturnType<typeof executeCommand>, { mode: "deferred" }>
): TerminalState => {
  if (state.pendingCommand) {
    return appendCommandWithItems(state, commandText, [
      {
        kind: "status",
        level: "warning",
        text: TERMINAL_PENDING_WARNING,
      },
    ]);
  }

  const nextState = appendItems(state, [
    { kind: "command", text: commandText },
    result.loadingItem,
  ]);
  const loadingItemId = nextState.appendedItems.at(-1)?.id;

  if (typeof loadingItemId !== "number") {
    return state;
  }

  return {
    ...state,
    input: "",
    items: nextState.items,
    history: [commandText, ...state.history],
    historyIndex: -1,
    nextItemId: nextState.nextItemId,
    pendingCommand: {
      ...result.pendingCommand,
      loadingItemId,
    },
  };
};

const submitCommand = (state: TerminalState): TerminalState => {
  const commandText = state.input.trim();
  if (!commandText) {
    return state;
  }

  const result = executeCommand(commandText);

  switch (result.mode) {
    case "reset":
      return createInitialTerminalState();
    case "immediate":
      return appendCommandWithItems(state, commandText, result.items);
    case "deferred":
      return startPendingCommand(state, commandText, result);
    default: {
      const exhaustiveCheck: never = result;
      throw new Error(`Unhandled command result: ${exhaustiveCheck}`);
    }
  }
};

const resolvePending = (
  state: TerminalState,
  completionItems: readonly TerminalTranscriptItemContent[]
): TerminalState => {
  if (!state.pendingCommand) {
    return state;
  }

  const items = state.items.filter(
    (item) => item.id !== state.pendingCommand?.loadingItemId
  );
  const resolvedItems = createTranscriptItems(state.nextItemId, completionItems);

  return {
    ...state,
    items: [...items, ...resolvedItems],
    nextItemId: state.nextItemId + resolvedItems.length,
    pendingCommand: null,
  };
};

export const terminalReducer = (
  state: TerminalState = createInitialTerminalState(),
  action: TerminalAction | UnknownAction
): TerminalState => {
  switch (action.type) {
    case TERMINAL_ACTION_TYPES.SET_INPUT:
      return typeof action.payload === "string"
        ? setCurrentInput(state, action.payload)
        : state;
    case TERMINAL_ACTION_TYPES.CLEAR_INPUT:
      return setCurrentInput(state, "");
    case TERMINAL_ACTION_TYPES.NAVIGATE_HISTORY:
      return action.payload === "up" || action.payload === "down"
        ? navigate(state, action.payload as HistoryDirection)
        : state;
    case TERMINAL_ACTION_TYPES.SUBMIT_INPUT:
      return submitCommand(state);
    case TERMINAL_ACTION_TYPES.RESOLVE_PENDING_COMMAND:
      return Array.isArray(action.payload)
        ? resolvePending(state, action.payload)
        : state;
    default:
      return state;
  }
};
