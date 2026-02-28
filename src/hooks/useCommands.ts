import { useCallback } from "react";
import { ResponseType, type ResponseItem } from "@types";
import { $history, $input, $cmdHistory, $cmdHistoryIndex } from "@stores/terminal";
import {
  $todos,
  addTodo,
  removeTodo,
  updateTodo,
  completeTodo,
  classifyTodo,
  setDueDate,
  removeInboxBucket,
  moveToInbox,
  setPriority,
  addTag,
  removeTag,
  type BucketName,
} from "@stores/todos";

type CommandHandler = (args: string[]) => ResponseItem[];
type CommandExecutor = (raw: string) => void;

type IndexedTodo = { index: number; text: string };

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

const BUCKET_ORDER: BucketName[] = ["inbox", "today", "upcoming", "anytime"];
const BUCKET_LABELS: Record<BucketName, string> = {
  inbox: "Inbox",
  today: "Today",
  upcoming: "Upcoming",
  anytime: "Anytime",
};

const indexTodos = (todos: string[]): IndexedTodo[] =>
  todos.map((t, i) => ({ index: i + 1, text: t }));

const buildBucketedResponse = (
  items: IndexedTodo[],
  bucketFilter?: BucketName
): ResponseItem[] => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const active = items.filter((t) => !t.text.startsWith("x "));

  if (!active.length) return [text("No todos.")];

  if (bucketFilter) {
    const filtered = active.filter(
      (t) => classifyTodo(t.text, todayStr) === bucketFilter
    );
    if (!filtered.length)
      return [text(`No ${BUCKET_LABELS[bucketFilter].toLowerCase()} todos.`)];
    return [{ type: ResponseType.Todo, items: filtered }];
  }

  const grouped = Object.fromEntries(
    BUCKET_ORDER.map((b) => [b, [] as IndexedTodo[]])
  ) as Record<BucketName, IndexedTodo[]>;
  for (const item of active) grouped[classifyTodo(item.text, todayStr)].push(item);

  const sections = BUCKET_ORDER
    .filter((b) => grouped[b].length > 0)
    .map((b) => ({ label: BUCKET_LABELS[b], items: grouped[b] }));

  return sections.length
    ? [{ type: ResponseType.BucketedTodo, sections }]
    : [text("No todos.")];
};

const handlers: Record<string, CommandHandler> = {
  help: () => [
    {
      type: ResponseType.Help,
      sections: [
        {
          title: "Commands",
          commands: [
            { name: "list [filter]", description: "list todos; filter by bucket (inbox, today, upcoming, anytime), @context, or +project" },
            { name: "add <text>", description: "add a new todo (goes to Inbox)" },
            { name: "done <number>", description: "mark a todo as complete" },
            { name: "delete <number>", description: "remove a todo (alias: rm)" },
            { name: "update <number> <text>", description: "replace a todo's full text" },
            { name: "update <number> due [YYYY-MM-DD]", description: "set or remove a due date" },
            { name: "update <number> priority [A-Z]", description: "set or remove a priority" },
            { name: "update <number> add <@context|+project>", description: "add a context or project tag" },
            { name: "update <number> remove <@context|+project>", description: "remove a context or project tag" },
            { name: "move <number> <destination>", description: "move a todo; dest: inbox, today, anytime, or YYYY-MM-DD" },
            { name: "clear", description: "clear the terminal history" },
            { name: "help", description: "show this help message" },
          ],
        },
      ],
    },
  ],
  list: (args) => {
    const rawFilter = args[0];
    if (!rawFilter) return buildBucketedResponse(indexTodos($todos.get()));

    if (rawFilter.startsWith("@") || rawFilter.startsWith("+")) {
      const items = indexTodos($todos.get()).filter((item) =>
        item.text.split(/\s+/).includes(rawFilter)
      );
      if (!items.length) return [text(`No todos matching '${rawFilter}'.`)];
      return buildBucketedResponse(items);
    }

    const filter = rawFilter.toLowerCase();
    const valid: BucketName[] = ["inbox", "today", "upcoming", "anytime"];
    if (!valid.includes(filter as BucketName))
      return [error(`list: unknown filter '${rawFilter}'. Use: inbox, today, upcoming, anytime, @context, +project`)];
    return buildBucketedResponse(indexTodos($todos.get()), filter as BucketName);
  },
  add: (args) => {
    if (!args.length) return [error("usage: add <text>")];
    const todo = addTodo(args.join(" "));
    return [success(`Added: ${todo}`), ...buildBucketedResponse(indexTodos($todos.get()))];
  },
  done: (args) => {
    const n = parseIndex(args[0]);
    const todos = $todos.get();
    if (n === null) return [error("usage: done <number>")];
    if (n < 1 || n > todos.length) return [error(`No todo #${n}`)];
    if (todos[n - 1].startsWith("x "))
      return [warning(`Todo #${n} is already complete`)];
    completeTodo(n);
    return [success(`Marked #${n} as done`), ...buildBucketedResponse(indexTodos($todos.get()))];
  },
  delete: (args) => {
    const n = parseIndex(args[0]);
    const todos = $todos.get();
    if (n === null) return [error("usage: delete <number>")];
    if (n < 1 || n > todos.length) return [error(`No todo #${n}`)];
    removeTodo(n);
    return [success(`Deleted #${n}`), ...buildBucketedResponse(indexTodos($todos.get()))];
  },
  update: (args) => {
    const n = parseIndex(args[0]);
    const todos = $todos.get();
    if (n === null) return [error("usage: update <number> [field] <value>")];
    if (n < 1 || n > todos.length) return [error(`No todo #${n}`)];

    const field = args[1]?.toLowerCase();

    if (field === "due") {
      if (todos[n - 1].startsWith("x ")) return [error(`Todo #${n} is complete`)];
      const date = args[2] ?? null;
      if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date))
        return [error("update: due date must be YYYY-MM-DD")];
      setDueDate(n, date);
      const verb = date ? `Set due date on #${n}: ${date}` : `Removed due date from #${n}`;
      return [success(verb), ...buildBucketedResponse(indexTodos($todos.get()))];
    }

    if (field === "priority") {
      const priorityArg = args[2]?.toUpperCase();
      if (priorityArg && !/^[A-Z]$/.test(priorityArg))
        return [error("update: priority must be a single letter A-Z")];
      setPriority(n, priorityArg ?? null);
      const verb = priorityArg ? `Set priority on #${n}: (${priorityArg})` : `Removed priority from #${n}`;
      return [success(verb), ...buildBucketedResponse(indexTodos($todos.get()))];
    }

    if (field === "add" || field === "remove") {
      if (todos[n - 1].startsWith("x ")) return [error(`Todo #${n} is complete`)];
      const tag = args[2];
      if (!tag || !(/^@\S+$/.test(tag) || /^\+\S+$/.test(tag)))
        return [error(`update ${field}: tag must start with @ or +`)];
      if (field === "add") {
        addTag(n, tag);
        return [success(`Added ${tag} to #${n}`), ...buildBucketedResponse(indexTodos($todos.get()))];
      } else {
        removeTag(n, tag);
        return [success(`Removed ${tag} from #${n}`), ...buildBucketedResponse(indexTodos($todos.get()))];
      }
    }

    const newText = args.slice(1).join(" ");
    if (!newText) return [error("usage: update <number> [field] <value>")];
    updateTodo({ index: n, text: newText });
    return [success(`Updated #${n}`), ...buildBucketedResponse(indexTodos($todos.get()))];
  },
  move: (args) => {
    const n = parseIndex(args[0]);
    const todos = $todos.get();
    if (n === null) return [error("usage: move <number> <destination>")];
    if (n < 1 || n > todos.length) return [error(`No todo #${n}`)];
    if (todos[n - 1].startsWith("x ")) return [error(`Todo #${n} is complete`)];

    const dest = args[1]?.toLowerCase();
    if (!dest) return [error("usage: move <number> <destination>")];

    const todayStr = new Date().toISOString().slice(0, 10);

    if (dest === "inbox") {
      moveToInbox(n);
      return [success(`Moved #${n} to Inbox`), ...buildBucketedResponse(indexTodos($todos.get()))];
    }

    if (dest === "today") {
      setDueDate(n, todayStr);
      return [success(`Moved #${n} to Today`), ...buildBucketedResponse(indexTodos($todos.get()))];
    }

    if (dest === "anytime") {
      removeInboxBucket(n);
      setDueDate(n, null);
      return [success(`Moved #${n} to Anytime`), ...buildBucketedResponse(indexTodos($todos.get()))];
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(dest)) {
      setDueDate(n, dest);
      return [success(`Moved #${n} to ${dest}`), ...buildBucketedResponse(indexTodos($todos.get()))];
    }

    return [error(`move: unknown destination '${dest}'. Use: inbox, today, anytime, YYYY-MM-DD`)];
  },
};

handlers.rm = handlers.delete;

export const COMMAND_NAMES = [...Object.keys(handlers), "clear"];

export const processCommand = (
  command: string,
  args: string[]
): ResponseItem[] =>
  handlers[command]?.(args) ?? [error(`${command}: command not found`)];

const runCommand: CommandExecutor = (raw) => {
  const trimmed = raw.trim();
  if (!trimmed) return;

  const [command, ...args] = trimmed.split(/\s+/);

  if (command === "clear") {
    $history.set([]);
    $input.set("");
    $cmdHistoryIndex.set(-1);
    return;
  }

  const history = $history.get();
  const cmdHistory = $cmdHistory.get();
  let responses: ResponseItem[];
  try {
    responses = processCommand(command, args);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    responses = [error(`${command}: ${message}`)];
  }

  $history.set([...history, { id: crypto.randomUUID(), command: trimmed, responses }]);
  $cmdHistory.set([trimmed, ...cmdHistory]);
  $input.set("");
  $cmdHistoryIndex.set(-1);
};

export const executeCommand = runCommand;

export const useCommands = (): CommandExecutor =>
  useCallback((raw: string) => {
    runCommand(raw);
  }, []);
