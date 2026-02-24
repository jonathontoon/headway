import { useReducer } from "react";
import type { TerminalResponse } from "../types/terminal-response";
import type { TerminalState, TerminalAction } from "../types/terminal";

const INITIAL_STATE: TerminalState = {
  history: [
    { type: "logo", id: "0" },
    { type: "intro", id: "1" },
  ],
  input: "",
  isProcessing: false,
  historyIndex: -1,
  commandHistory: [],
};

const terminalReducer = (
  state: TerminalState,
  action: TerminalAction
): TerminalState => {
  switch (action.type) {
    case "PUSH_RESPONSE":
      return {
        ...state,
        history: [
          ...state.history,
          ...action.payload.map((item: TerminalResponse, i: number) => ({
            ...item,
            id: String(state.history.length + i),
          })),
        ],
      };
    case "SET_INPUT":
      return { ...state, input: action.payload };
    case "SET_PROCESSING":
      return { ...state, isProcessing: action.payload };
    case "RESET":
      return { ...state, history: [] };
    case "ADD_COMMAND": {
      return {
        ...state,
        commandHistory: action.payload.trim()
          ? [action.payload, ...state.commandHistory]
          : state.commandHistory,
        historyIndex: -1,
      };
    }
    case "SET_HISTORY_INDEX": {
      const cmd = state.commandHistory[action.payload] ?? "";
      return {
        ...state,
        historyIndex: action.payload,
        input: cmd,
      };
    }
    default:
      return state;
  }
};

export const useTerminal = () => {
  const [state, dispatch] = useReducer(terminalReducer, INITIAL_STATE);

  const addResponse = (responses: TerminalResponse[]) => {
    dispatch({ type: "PUSH_RESPONSE", payload: responses });
  };

  const setInput = (value: string) => {
    dispatch({ type: "SET_INPUT", payload: value });
  };

  const setProcessing = (value: boolean) => {
    dispatch({ type: "SET_PROCESSING", payload: value });
  };

  const reset = () => {
    dispatch({ type: "RESET" });
  };

  const addCommand = (cmd: string) => {
    dispatch({ type: "ADD_COMMAND", payload: cmd });
  };

  const navigateHistory = (direction: "up" | "down") => {
    const newIdx =
      direction === "up"
        ? Math.min(state.historyIndex + 1, state.commandHistory.length - 1)
        : Math.max(state.historyIndex - 1, -1);
    dispatch({ type: "SET_HISTORY_INDEX", payload: newIdx });
  };

  return {
    history: state.history,
    input: state.input,
    isProcessing: state.isProcessing,
    addResponse,
    setInput,
    setProcessing,
    reset,
    addCommand,
    navigateHistory,
  };
};
