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
    text("Available commands:"),
    text("  help           show this help message"),
    text("  list           list all todos"),
    text("  echo [text]    print text to the terminal"),
    text("  date           show current date and time"),
    text("  clear          clear the terminal history"),
  ],
  list: () => {
    const todos = getTodos();
    if (!todos.length) return [text("No todos.")];
    return todos.map((raw, i): ResponseItem => ({ type: ResponseType.Todo, index: i + 1, raw }));
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
