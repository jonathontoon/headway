import { create, type StateCreator } from "zustand";
import { devtools } from "zustand/middleware";
import { ResponseType, type HistoryEntry } from "@types";
import { processCommand } from "@utils/commands";
import { useTodoStore } from "@stores/useTodoStore";

const buildWelcome = (): HistoryEntry => {
  const { todos } = useTodoStore.getState();
  return {
    id: crypto.randomUUID(),
    command: "",
    responses: [
      {
        type: ResponseType.Text,
        text: "Welcome to Headway. Type 'help' for available commands.",
      },
      ...todos.map((text, i) => ({
        type: ResponseType.Todo as const,
        index: i + 1,
        text,
      })),
    ],
  };
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

type SetTerminal = Parameters<
  StateCreator<
    TerminalState & TerminalActions,
    [["zustand/devtools", never]],
    []
  >
>[0];

type GetTerminal = Parameters<
  StateCreator<
    TerminalState & TerminalActions,
    [["zustand/devtools", never]],
    []
  >
>[1];

const defaultState: TerminalState = {
  history: [buildWelcome()],
  input: "",
  cmdHistory: [],
  cmdHistoryIndex: -1,
};

const setInput =
  (set: SetTerminal) =>
  (value: string): void =>
    set({ input: value }, false, "setInput");

const navigateHistory =
  (set: SetTerminal, get: GetTerminal) =>
  (dir: "up" | "down"): void => {
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
        set({ cmdHistoryIndex: -1, input: "" }, false, "navigateHistory/down");
      } else {
        set(
          { cmdHistoryIndex: newIndex, input: cmdHistory[newIndex] ?? "" },
          false,
          "navigateHistory/down"
        );
      }
    }
  };

const executeCommand =
  (set: SetTerminal, get: GetTerminal) =>
  (raw: string): void => {
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
  };

export const useTerminalStore = create<TerminalState & TerminalActions>()(
  devtools(
    (set, get) => ({
      ...defaultState,
      setInput: setInput(set),
      navigateHistory: navigateHistory(set, get),
      executeCommand: executeCommand(set, get),
    }),
    { name: "TerminalStore" }
  )
);
