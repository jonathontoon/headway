import { $todos } from "@stores/todos";
import { COMMAND_NAMES } from "@utils/commands";

export interface AutocompleteResult {
  completed: string;
  insertPosition: number;
}

export const getAutocomplete = (
  input: string,
  cursorPos: number
): AutocompleteResult | null => {
  // Get text before cursor
  const textBeforeCursor = input.slice(0, cursorPos);
  const words = textBeforeCursor.split(/\s+/);
  const lastWord = words[words.length - 1] ?? "";

  // Complete command
  if (words.length === 1 && lastWord) {
    const match = COMMAND_NAMES.find((cmd) =>
      cmd.startsWith(lastWord.toLowerCase())
    );
    if (match) {
      const suffix = match.slice(lastWord.length);
      return {
        completed: input.slice(0, cursorPos) + suffix + input.slice(cursorPos),
        insertPosition: cursorPos + suffix.length,
      };
    }
  }

  // Complete "update <number>" or "update <number> "
  const firstWord = words[0]?.toLowerCase() ?? "";
  if (firstWord === "update" && words.length >= 2) {
    const numberStr = words[1];
    const num = parseInt(numberStr, 10);
    if (!isNaN(num) && num >= 1) {
      const todos = $todos.get();
      if (num <= todos.length) {
        const todoText = todos[num - 1];
        // Build: "update <number> <todoText>"
        const completed = `update ${numberStr} ${todoText}`;
        return {
          completed,
          insertPosition: completed.length,
        };
      }
    }
  }

  return null;
};
