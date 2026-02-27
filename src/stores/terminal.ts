import { atom } from "nanostores";
import { ResponseType, type HistoryEntry } from "@types";
import { processCommand } from "@utils/commands";
import { $todos } from "@stores/todos";

export const $history = atom<HistoryEntry[]>([
  {
    id: crypto.randomUUID(),
    command: "",
    responses: [
      {
        type: ResponseType.Text,
        text: "Welcome to Headway. Type 'help' for available commands.",
      },
      ...$todos.get().map((text, i) => ({
        type: ResponseType.Todo as const,
        index: i + 1,
        text,
      })),
    ],
  },
]);
export const $input = atom("");
export const $cmdHistory = atom<string[]>([]);
export const $cmdHistoryIndex = atom(-1);

export const navigateHistory = (direction: "up" | "down") => {
  const cmdHistory = $cmdHistory.get();
  const cmdHistoryIndex = $cmdHistoryIndex.get();
  if (direction === "up") {
    const newIndex = Math.min(cmdHistoryIndex + 1, cmdHistory.length - 1);
    $cmdHistoryIndex.set(newIndex);
    $input.set(cmdHistory[newIndex] ?? "");
  } else {
    const newIndex = cmdHistoryIndex - 1;
    if (newIndex < 0) {
      $cmdHistoryIndex.set(-1);
      $input.set("");
    } else {
      $cmdHistoryIndex.set(newIndex);
      $input.set(cmdHistory[newIndex] ?? "");
    }
  }
};

export const executeCommand = (raw: string) => {
  const trimmed = raw.trim();
  if (!trimmed) return;

  const [command, ...args] = trimmed.split(/\s+/);

  if (command === "clear") {
    $history.set([]);
    $input.set("");
    $cmdHistoryIndex.set(-1);
    return;
  }

  const history = $history.get();
  const cmdHistory = $cmdHistory.get();
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

  $history.set([...history, entry]);
  $cmdHistory.set([trimmed, ...cmdHistory]);
  $input.set("");
  $cmdHistoryIndex.set(-1);
};
