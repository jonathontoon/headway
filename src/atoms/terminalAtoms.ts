import { atom } from "nanostores";
import { ResponseType, type HistoryEntry } from "@types";
import { processCommand } from "@utils/commands";
import { todosAtom } from "@atoms/todoAtoms";

const buildWelcome = (): HistoryEntry => {
  const todos = todosAtom.get();
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

export const historyAtom = atom<HistoryEntry[]>([buildWelcome()]);
export const inputAtom = atom("");
export const cmdHistoryAtom = atom<string[]>([]);
export const cmdHistoryIndexAtom = atom(-1);

export const navigateHistory = (dir: "up" | "down") => {
  const cmdHistory = cmdHistoryAtom.get();
  const cmdHistoryIndex = cmdHistoryIndexAtom.get();
  if (dir === "up") {
    const newIndex = Math.min(cmdHistoryIndex + 1, cmdHistory.length - 1);
    cmdHistoryIndexAtom.set(newIndex);
    inputAtom.set(cmdHistory[newIndex] ?? "");
  } else {
    const newIndex = cmdHistoryIndex - 1;
    if (newIndex < 0) {
      cmdHistoryIndexAtom.set(-1);
      inputAtom.set("");
    } else {
      cmdHistoryIndexAtom.set(newIndex);
      inputAtom.set(cmdHistory[newIndex] ?? "");
    }
  }
};

export const executeCommand = (raw: string) => {
  const trimmed = raw.trim();
  if (!trimmed) return;

  const [command, ...args] = trimmed.split(/\s+/);

  if (command === "clear") {
    historyAtom.set([]);
    inputAtom.set("");
    cmdHistoryIndexAtom.set(-1);
    return;
  }

  const history = historyAtom.get();
  const cmdHistory = cmdHistoryAtom.get();
  let responses: HistoryEntry["responses"];
  try {
    responses = processCommand(command, args);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    responses = [{ type: ResponseType.Error, text: `${command}: ${message}` }];
  }
  const entry: HistoryEntry = {
    id: crypto.randomUUID(),
    command: trimmed,
    responses,
  };

  historyAtom.set([...history, entry]);
  cmdHistoryAtom.set([trimmed, ...cmdHistory]);
  inputAtom.set("");
  cmdHistoryIndexAtom.set(-1);
};
