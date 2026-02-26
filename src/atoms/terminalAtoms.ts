import { atom, getDefaultStore } from "jotai";
import { ResponseType, type HistoryEntry } from "@types";
import { processCommand } from "@utils/commands";
import { todosAtom } from "@atoms/todoAtoms";

const buildWelcome = (): HistoryEntry => {
  const todos = getDefaultStore().get(todosAtom);
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

export const navigateHistoryAtom = atom(
  null,
  (get, set, dir: "up" | "down") => {
    const cmdHistory = get(cmdHistoryAtom);
    const cmdHistoryIndex = get(cmdHistoryIndexAtom);
    if (dir === "up") {
      const newIndex = Math.min(cmdHistoryIndex + 1, cmdHistory.length - 1);
      set(cmdHistoryIndexAtom, newIndex);
      set(inputAtom, cmdHistory[newIndex] ?? "");
    } else {
      const newIndex = cmdHistoryIndex - 1;
      if (newIndex < 0) {
        set(cmdHistoryIndexAtom, -1);
        set(inputAtom, "");
      } else {
        set(cmdHistoryIndexAtom, newIndex);
        set(inputAtom, cmdHistory[newIndex] ?? "");
      }
    }
  }
);

export const executeCommandAtom = atom(null, (get, set, raw: string) => {
  const trimmed = raw.trim();
  if (!trimmed) return;

  const [command, ...args] = trimmed.split(/\s+/);

  if (command === "clear") {
    set(historyAtom, []);
    set(inputAtom, "");
    set(cmdHistoryIndexAtom, -1);
    return;
  }

  const history = get(historyAtom);
  const cmdHistory = get(cmdHistoryAtom);
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

  set(historyAtom, [...history, entry]);
  set(cmdHistoryAtom, [trimmed, ...cmdHistory]);
  set(inputAtom, "");
  set(cmdHistoryIndexAtom, -1);
});
