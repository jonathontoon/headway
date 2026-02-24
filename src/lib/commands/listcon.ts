import type { TerminalResponse } from "../../types/terminal-response";
import { loadContent } from "../../utils/storage";
import { parseTodos, getUniqueContexts } from "../todoService";

const listconCommand = (): TerminalResponse => {
  try {
    const content = loadContent();
    const todos = parseTodos(content);
    const tags = getUniqueContexts(todos);

    if (tags.length === 0) {
      return {
        type: "status",
        statusType: "waiting",
        statusText: "No contexts found.",
      };
    }

    return { type: "tag", tags, variant: "context" };
  } catch {
    return {
      type: "status",
      statusType: "error",
      statusText: "Failed to list contexts.",
    };
  }
};

export default listconCommand;
