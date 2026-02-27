import { ResponseType, type ResponseItem } from "@types";
import {
  $todos,
  addTodo,
  removeTodo,
  updateTodo,
  completeTodo,
} from "@stores/todos";

type CommandHandler = (args: string[]) => ResponseItem[];

const parseIndex = (arg: string | undefined): number | null => {
  const n = parseInt(arg ?? "", 10);
  return isNaN(n) ? null : n;
};

const text = (t: string): ResponseItem => ({
  type: ResponseType.Text,
  text: t,
});
const error = (t: string): ResponseItem => ({
  type: ResponseType.Error,
  text: t,
});
const success = (t: string): ResponseItem => ({
  type: ResponseType.Success,
  text: t,
});
const warning = (t: string): ResponseItem => ({
  type: ResponseType.Warning,
  text: t,
});

const listTodos = (): ResponseItem[] => {
  const todos = $todos.get();
  if (!todos.length) return [text("No todos.")];
  return todos.map(
    (t, i): ResponseItem => ({ type: ResponseType.Todo, index: i + 1, text: t })
  );
};

const handlers: Record<string, CommandHandler> = {
  help: () => [
    {
      type: ResponseType.Help,
      sections: [
        {
          title: "Todos",
          commands: [
            { name: "list", description: "list all todos" },
            { name: "add <text>", description: "add a new todo" },
            { name: "done <number>", description: "mark a todo as complete" },
            {
              name: "delete <number>",
              description: "remove a todo (alias: rm)",
            },
            {
              name: "update <number> <text>",
              description: "replace a todo's text",
            },
          ],
        },
        {
          title: "Terminal",
          commands: [
            { name: "echo <text>", description: "print text to the terminal" },
            { name: "date", description: "show current date and time" },
            { name: "clear", description: "clear the terminal history" },
            { name: "help", description: "show this help message" },
          ],
        },
      ],
    },
  ],
  list: () => listTodos(),
  add: (args) => {
    if (!args.length) return [error("usage: add <text>")];
    addTodo(args.join(" "));
    return [success(`Added: ${args.join(" ")}`), ...listTodos()];
  },
  done: (args) => {
    const n = parseIndex(args[0]);
    const todos = $todos.get();
    if (n === null) return [error("usage: done <number>")];
    if (n < 1 || n > todos.length) return [error(`No todo #${n}`)];
    if (todos[n - 1].startsWith("x "))
      return [warning(`Todo #${n} is already complete`)];
    completeTodo(n);
    return [success(`Marked #${n} as done`), ...listTodos()];
  },
  delete: (args) => {
    const n = parseIndex(args[0]);
    const todos = $todos.get();
    if (n === null) return [error("usage: delete <number>")];
    if (n < 1 || n > todos.length) return [error(`No todo #${n}`)];
    removeTodo(n);
    return [success(`Deleted #${n}`), ...listTodos()];
  },
  update: (args) => {
    const n = parseIndex(args[0]);
    const newText = args.slice(1).join(" ");
    const todos = $todos.get();
    if (n === null || !newText) return [error("usage: update <number> <text>")];
    if (n < 1 || n > todos.length) return [error(`No todo #${n}`)];
    updateTodo({ index: n, text: newText });
    return [success(`Updated #${n}`), ...listTodos()];
  },
  echo: (args) =>
    args.length ? [text(args.join(" "))] : [error("usage: echo <text>")],
  date: () => [text(new Date().toLocaleString())],
};

handlers.rm = handlers.delete;

export const COMMAND_NAMES = [...Object.keys(handlers), "clear"];

export const processCommand = (
  command: string,
  args: string[]
): ResponseItem[] =>
  handlers[command]?.(args) ?? [error(`${command}: command not found`)];
