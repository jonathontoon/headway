import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { ResponseType, type HistoryEntry } from "@types";
import { processCommand } from "@utils/commands";

const WELCOME: HistoryEntry = {
  id: crypto.randomUUID(),
  command: "",
  responses: [
    {
      type: ResponseType.Text,
      text: "Welcome to Headway. Type 'help' for available commands.",
    },
  ],
};

interface TerminalState {
  history: HistoryEntry[];
  input: string;
  cmdHistory: string[];
  cmdHistoryIndex: number;
}

interface TerminalActions {
  setInput: (value: string) => void;
  navigateHistory: (dir: "up" | "down") => void;
  executeCommand: (raw: string) => void;
}

export const useTerminalStore = create<TerminalState & TerminalActions>()(
  devtools(
    (set, get) => ({
      history: [WELCOME],
      input: "",
      cmdHistory: [],
      cmdHistoryIndex: -1,

      setInput: (value) => set({ input: value }, false, "setInput"),

      navigateHistory: (dir) => {
        const { cmdHistory, cmdHistoryIndex } = get();
        if (dir === "up") {
          const newIndex = Math.min(cmdHistoryIndex + 1, cmdHistory.length - 1);
          set(
            { cmdHistoryIndex: newIndex, input: cmdHistory[newIndex] ?? "" },
            false,
            "navigateHistory/up"
          );
        } else {
          const newIndex = cmdHistoryIndex - 1;
          if (newIndex < 0) {
            set(
              { cmdHistoryIndex: -1, input: "" },
              false,
              "navigateHistory/down"
            );
          } else {
            set(
              { cmdHistoryIndex: newIndex, input: cmdHistory[newIndex] ?? "" },
              false,
              "navigateHistory/down"
            );
          }
        }
      },

      executeCommand: (raw) => {
        const trimmed = raw.trim();
        if (!trimmed) return;

        const [command, ...args] = trimmed.split(/\s+/);

        if (command === "clear") {
          set(
            { history: [], input: "", cmdHistoryIndex: -1 },
            false,
            "executeCommand/clear"
          );
          return;
        }

        const { history, cmdHistory } = get();
        let responses: HistoryEntry["responses"];
        try {
          responses = processCommand(command, args);
        } catch (err) {
          const message = err instanceof Error ? err.message : "unknown error";
          responses = [
            { type: ResponseType.Error, text: `${command}: ${message}` },
          ];
        }
        const entry: HistoryEntry = {
          id: crypto.randomUUID(),
          command: trimmed,
          responses,
        };

        set(
          {
            history: [...history, entry],
            cmdHistory: [trimmed, ...cmdHistory],
            input: "",
            cmdHistoryIndex: -1,
          },
          false,
          "executeCommand"
        );
      },
    }),
    { name: "TerminalStore" }
  )
);
