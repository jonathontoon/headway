import type { TerminalResponse } from "./terminal-response";

export type HistoryItem = TerminalResponse & { id: string };

export type TerminalState = {
  history: HistoryItem[];
  input: string;
  isProcessing: boolean;
  historyIndex: number;
  commandHistory: string[];
};

export type TerminalAction =
  | { type: "PUSH_RESPONSE"; payload: TerminalResponse[] }
  | { type: "SET_INPUT"; payload: string }
  | { type: "SET_PROCESSING"; payload: boolean }
  | { type: "RESET" }
  | { type: "ADD_COMMAND"; payload: string }
  | { type: "SET_HISTORY_INDEX"; payload: number };
