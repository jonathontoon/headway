import type { TerminalResponse } from "@types";
import { MAX_TODO_LENGTH } from "@constants";
import { filterTodos } from "@utils/todos";
import { useTodoStore } from "@stores/useTodoStore";

type CommandHandler = (args: string[]) => TerminalResponse[];

const parseTaskNumber = (arg: string): { n: number } | { error: TerminalResponse[] } => {
  const n = parseInt(arg, 10);
  if (!Number.isInteger(n)) {
    return {
      error: [
        {
          type: "status",
          statusType: "error",
          statusText: "Invalid task number.",
          hintText: "Please provide a valid task number.",
        },
      ],
    };
  }
  return { n };
};

const handleAdd: CommandHandler = (args) => {
  const text = args.join(" ").trim();
  if (!text) {
    return [{ type: "status", statusType: "error", statusText: "No text provided.", hintText: "Usage: add [task text]" }];
  }
  if (text.length > MAX_TODO_LENGTH) {
    return [{ type: "status", statusType: "error", statusText: "Task text too long.", hintText: `Maximum length is ${MAX_TODO_LENGTH} characters.` }];
  }
  const result = useTodoStore.getState().addTodo(text);
  if ("error" in result) {
    return [{ type: "status", statusType: "error", statusText: result.error }];
  }
  return [
    { type: "status", statusType: "success", statusText: `Added: ${text}` },
    { type: "todo", todos: result.todos, title: undefined },
  ];
};

const handleList: CommandHandler = (args) => {
  const isValidFilter = (filter: string): boolean => {
    if (filter === "completed" || filter === "archived") return true;
    if (filter.startsWith("@") || filter.startsWith("+")) return true;
    return false;
  };
  if (args.length > 1) {
    return [{ type: "status", statusType: "error", statusText: "Invalid arguments.", hintText: "Usage: list [filter]" }];
  }
  const filter = args[0];
  if (filter && !isValidFilter(filter)) {
    return [{ type: "status", statusType: "error", statusText: `Invalid filter: ${filter}`, hintText: "Filters: completed, archived, @context, +project" }];
  }
  const { todos } = useTodoStore.getState();
  const filtered = filter ? filterTodos(filter, todos) : todos;
  const title = filter ? `Tasks matching ${filter}` : undefined;
  return [{ type: "todo", todos: filtered, title }];
};

const handleDone: CommandHandler = (args) => {
  if (!args[0]) {
    return [{ type: "status", statusType: "error", statusText: "Missing task number.", hintText: "Usage: done [number]" }];
  }
  if (args.length > 1) {
    return [{ type: "status", statusType: "error", statusText: "Invalid arguments.", hintText: "Usage: done [number]" }];
  }
  const parsed = parseTaskNumber(args[0]);
  if ("error" in parsed) return parsed.error;
  const result = useTodoStore.getState().completeTodo(parsed.n);
  if ("error" in result) {
    return [{ type: "status", statusType: "error", statusText: result.error }];
  }
  return [
    { type: "status", statusType: "success", statusText: `Marked task #${parsed.n} as complete.` },
    { type: "todo", todos: result.todos, title: undefined },
  ];
};

const handleRemove: CommandHandler = (args) => {
  if (!args[0]) {
    return [{ type: "status", statusType: "error", statusText: "Missing task number.", hintText: "Usage: remove [number]" }];
  }
  if (args.length > 1) {
    return [{ type: "status", statusType: "error", statusText: "Invalid arguments.", hintText: "Usage: remove [number]" }];
  }
  const parsed = parseTaskNumber(args[0]);
  if ("error" in parsed) return parsed.error;
  const result = useTodoStore.getState().removeTodo(parsed.n);
  if ("error" in result) {
    return [{ type: "status", statusType: "error", statusText: result.error }];
  }
  return [
    { type: "status", statusType: "success", statusText: `Removed task #${parsed.n}.` },
    { type: "todo", todos: result.todos, title: undefined },
  ];
};

const handleEdit: CommandHandler = (args) => {
  if (args.length < 2) {
    return [{ type: "status", statusType: "error", statusText: "Missing arguments.", hintText: "Usage: edit [number] [text]" }];
  }
  const parsed = parseTaskNumber(args[0]);
  if ("error" in parsed) return parsed.error;
  const text = args.slice(1).join(" ").trim();
  if (!text) {
    return [{ type: "status", statusType: "error", statusText: "Missing arguments.", hintText: "Usage: edit [number] [text]" }];
  }
  if (text.length > MAX_TODO_LENGTH) {
    return [{ type: "status", statusType: "error", statusText: "Task text too long.", hintText: `Maximum length is ${MAX_TODO_LENGTH} characters.` }];
  }
  const result = useTodoStore.getState().editTodo(parsed.n, text);
  if ("error" in result) {
    return [{ type: "status", statusType: "error", statusText: result.error }];
  }
  return [
    { type: "status", statusType: "success", statusText: `Edited task #${parsed.n}.` },
    { type: "todo", todos: result.todos, title: undefined },
  ];
};

const handleHelp: CommandHandler = (args) => {
  if (args.length > 0) {
    return [{ type: "status", statusType: "error", statusText: "Invalid arguments.", hintText: "Usage: help" }];
  }
  return [{ type: "help" }];
};

export const commands: Record<string, CommandHandler> = {
  add: handleAdd, a: handleAdd,
  list: handleList, ls: handleList,
  done: handleDone,
  remove: handleRemove, rm: handleRemove,
  edit: handleEdit,
  help: handleHelp,
};
