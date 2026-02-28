import { atom } from "nanostores";
import { ResponseType, type HistoryEntry } from "@types";
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
      ...($todos.get().length > 0
        ? [
            {
              type: ResponseType.Todo as const,
              items: $todos.get().map((text, i) => ({
                index: i + 1,
                text,
              })),
            },
          ]
        : []),
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

