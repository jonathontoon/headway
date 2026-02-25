import type { TerminalResponse } from "@types";
import { filterTodos } from "@utils/todos";
import { useTodoStore } from "@stores/useTodoStore";

const isValidFilter = (filter: string): boolean => {
  if (filter === "completed" || filter === "archived") return true;
  if (filter.startsWith("@") || filter.startsWith("+")) return true;
  return false;
};

export const aliases = ["list", "ls"];

export const execute = (args: string[]): TerminalResponse[] => {
  if (args.length > 1) {
    return [
      {
        type: "status",
        statusType: "error",
        statusText: "Invalid arguments.",
        hintText: "Usage: list [filter]",
      },
    ];
  }

  const filter = args[0];

  if (filter && !isValidFilter(filter)) {
    return [
      {
        type: "status",
        statusType: "error",
        statusText: `Invalid filter: ${filter}`,
        hintText: "Filters: completed, archived, @context, +project",
      },
    ];
  }

  const { todos } = useTodoStore.getState();
  const filtered = filter ? filterTodos(filter, todos) : todos;
  const title = filter ? `Tasks matching ${filter}` : undefined;
  return [{ type: "todo", todos: filtered, title }];
};
