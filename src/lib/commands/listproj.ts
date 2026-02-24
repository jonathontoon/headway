import type { TerminalResponse } from "../../types/terminal-response";
import { loadContent } from "../../utils/storage";
import { parseTodos, getUniqueProjects } from "@utils/todos";

const listprojCommand = (): TerminalResponse => {
  try {
    const content = loadContent();
    const todos = parseTodos(content);
    const tags = getUniqueProjects(todos);

    if (tags.length === 0) {
      return {
        type: "status",
        statusType: "waiting",
        statusText: "No projects found.",
      };
    }

    return { type: "tag", tags, variant: "project" };
  } catch {
    return {
      type: "status",
      statusType: "error",
      statusText: "Failed to list projects.",
    };
  }
};

export default listprojCommand;
