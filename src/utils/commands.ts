import { ResponseType, type ResponseItem } from "@types";
import { getTodos } from "@stores/todoStore";

type CommandHandler = (args: string[]) => ResponseItem[];

const text = (t: string): ResponseItem => ({
  type: ResponseType.Text,
  text: t,
});
const error = (t: string): ResponseItem => ({
  type: ResponseType.Error,
  text: t,
});

const handlers: Record<string, CommandHandler> = {
  help: () => [
    {
      type: ResponseType.Help,
      commands: [
        { name: "help", description: "show this help message" },
        { name: "list", description: "list all todos" },
        { name: "echo [text]", description: "print text to the terminal" },
        { name: "date", description: "show current date and time" },
        { name: "clear", description: "clear the terminal history" },
      ],
    },
  ],
  list: () => {
    const todos = getTodos();
    if (!todos.length) return [text("No todos.")];
    return todos.map((text, i): ResponseItem => ({ type: ResponseType.Todo, index: i + 1, text }));
  },
  echo: (args) =>
    args.length ? [text(args.join(" "))] : [error("usage: echo <text>")],
  date: () => [text(new Date().toLocaleString())],
};

export const processCommand = (
  command: string,
  args: string[]
): ResponseItem[] =>
  handlers[command]?.(args) ?? [error(`${command}: command not found`)];
