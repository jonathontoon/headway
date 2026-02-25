import { create } from "zustand";
import type { TerminalResponse, HistoryItem } from "@types";
import { parseCommand, parseArguments } from "@utils/parse";
import { commandRegistry } from "../commands";

const INITIAL_HISTORY: HistoryItem[] = [
  { type: "logo", id: "0" },
  { type: "intro", id: "1" },
];

interface TerminalStore {
  history: HistoryItem[];
  input: string;
  isProcessing: boolean;
  historyIndex: number;
  commandHistory: string[];
  addResponse: (responses: TerminalResponse[]) => void;
  setInput: (value: string) => void;
  setProcessing: (value: boolean) => void;
  reset: () => void;
  navigateHistory: (direction: "up" | "down") => void;
  executeCommand: (prompt: string) => void;
}

export const useTerminalStore = create<TerminalStore>((set) => {
  const addResponse = (responses: TerminalResponse[]) => {
    if (responses.some((r) => r.type === "clear")) {
      set({ history: [] });
      return;
    }
    set((state) => ({
      history: [
        ...state.history,
        ...responses.map((item, i) => ({
          ...item,
          id: String(state.history.length + i),
        })),
      ],
    }));
  };

  const setInput = (value: string) => set({ input: value });
  const setProcessing = (value: boolean) => set({ isProcessing: value });
  const reset = () => set({ history: [] });

  const navigateHistory = (direction: "up" | "down") => {
    set((state) => {
      const newIdx =
        direction === "up"
          ? Math.min(state.historyIndex + 1, state.commandHistory.length - 1)
          : Math.max(state.historyIndex - 1, -1);
      return {
        historyIndex: newIdx,
        input: state.commandHistory[newIdx] ?? "",
      };
    });
  };

  const executeCommand = (prompt: string) => {
    const command = parseCommand(prompt);
    const args = parseArguments(prompt, command);

    set((state) => ({
      history: [
        ...state.history,
        { type: "prompt" as const, value: prompt, id: String(state.history.length) },
      ],
      commandHistory: prompt.trim()
        ? [prompt, ...state.commandHistory]
        : state.commandHistory,
      historyIndex: -1,
      input: "",
    }));

    const handler = commandRegistry[command];
    const responses: TerminalResponse[] = handler
      ? handler(args)
      : [{ type: "default", commandName: command, hintText: "Type 'help' for commands." }];

    if (responses.some((r) => r.type === "clear")) {
      set({ history: [] });
    } else {
      set((state) => ({
        history: [
          ...state.history,
          ...responses.map((item, i) => ({
            ...item,
            id: String(state.history.length + i),
          })),
        ],
      }));
    }
  };

  return {
    history: INITIAL_HISTORY,
    input: "",
    isProcessing: false,
    historyIndex: -1,
    commandHistory: [],
    addResponse,
    setInput,
    setProcessing,
    reset,
    navigateHistory,
    executeCommand,
  };
});
