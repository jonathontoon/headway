import type { TerminalResponse } from "../../types/terminal-response";
import { loadContent, saveContent } from "../../utils/storage";
import { parseTodos, archiveTodos, serializeTodos } from "../todoService";

const archiveCommand = (): TerminalResponse => {
  try {
    const content = loadContent();
    const todos = parseTodos(content);
    const completedCount = todos.filter((t) => t.done).length;

    if (completedCount === 0) {
      return {
        type: "status",
        statusType: "waiting",
        statusText: "No completed todos to archive.",
      };
    }

    const updated = archiveTodos(todos);
    const serialized = serializeTodos(updated);
    saveContent(serialized);

    return {
      type: "status",
      statusType: "success",
      statusText: `Archived ${completedCount} completed todo(s).`,
    };
  } catch {
    return {
      type: "status",
      statusType: "error",
      statusText: "Failed to archive todos.",
    };
  }
};

export default archiveCommand;
