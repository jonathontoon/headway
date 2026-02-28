import { TERMINAL_ACTION_TYPES } from "../constants";
import type {
  HistoryDirection,
  TerminalAction,
  TerminalTranscriptItemContent,
} from "../types";

export const setInput = (value: string): TerminalAction => ({
  type: TERMINAL_ACTION_TYPES.SET_INPUT,
  payload: value,
});

export const clearInput = (): TerminalAction => ({
  type: TERMINAL_ACTION_TYPES.CLEAR_INPUT,
});

export const navigateHistory = (direction: HistoryDirection): TerminalAction => ({
  type: TERMINAL_ACTION_TYPES.NAVIGATE_HISTORY,
  payload: direction,
});

export const submitInput = (): TerminalAction => ({
  type: TERMINAL_ACTION_TYPES.SUBMIT_INPUT,
});

export const resolvePendingCommand = (
  items: readonly TerminalTranscriptItemContent[]
): TerminalAction => ({
  type: TERMINAL_ACTION_TYPES.RESOLVE_PENDING_COMMAND,
  payload: items,
});
