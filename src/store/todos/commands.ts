import { HELP_TEXT } from "../../constants";
import { isTodoDate, parseTodoLine, serializeTodo } from "./parser";
import type {
  TodoClock,
  TodoCommandResult,
  TodoCommandState,
  TodoMetadata,
  TodoTask,
} from "./types";

const PRIORITY_PATTERN = /^[A-Z]$/;
const CONTEXT_PATTERN = /^@\S+$/;
const PROJECT_PATTERN = /^\+\S+$/;

type IndexedTask = {
  readonly id: number;
  readonly task: TodoTask;
  readonly line: string;
};

type TaskUpdate = {
  readonly task: TodoTask;
  readonly output?: string;
};

const defaultClock: TodoClock = {
  today: () => {
    const date = new Date();
    const offsetMs = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - offsetMs).toISOString().slice(0, 10);
  },
};

function parseTasks(todos: readonly string[]): readonly IndexedTask[] {
  return todos.flatMap((line, index) => {
    const result = parseTodoLine(line);
    return result.ok ? [{ id: index + 1, task: result.task, line }] : [];
  });
}

function findTask(
  todos: readonly string[],
  idText: string | undefined,
): { readonly index: number; readonly task: TodoTask } | string {
  const id = Number(idText);

  if (!Number.isInteger(id) || id < 1 || id > todos.length) {
    return "Error: no task with that id.";
  }

  const result = parseTodoLine(todos[id - 1]);
  if (!result.ok) {
    return `Error: task ${id} is not valid todo.txt.`;
  }

  return { index: id - 1, task: result.task };
}

function replaceAt(
  todos: readonly string[],
  index: number,
  task: TodoTask,
): readonly string[] {
  return todos.map((todo, i) => (i === index ? serializeTodo(task) : todo));
}

function taskLabel(task: TodoTask): string {
  return task.text
    .replace(/\s+pri:[^:\s]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function removeMetadata(text: string, key: string): string {
  return text
    .split(/\s+/)
    .filter((word) => !word.startsWith(`${key}:`))
    .join(" ");
}

function addOrReplaceMetadata(
  text: string,
  key: string,
  value: string,
): string {
  const withoutKey = removeMetadata(text, key);
  return `${withoutKey} ${key}:${value}`.trim();
}

function removeTokens(
  text: string,
  predicate: (word: string) => boolean,
): string {
  return text
    .split(/\s+/)
    .filter((word) => !predicate(word))
    .join(" ");
}

function addUniqueTokens(text: string, tokens: readonly string[]): string {
  const words = text.split(/\s+/).filter(Boolean);
  const additions = tokens.filter((token) => !words.includes(token));
  return [...words, ...additions].join(" ");
}

function taskFromInput(
  text: string,
  fallbackCreationDate: string,
): TodoTask | undefined {
  const parsed = parseTodoLine(text);

  if (!parsed.ok) {
    return undefined;
  }

  if (parsed.task.completed) {
    return parsed.task;
  }

  return {
    ...parsed.task,
    creationDate: parsed.task.creationDate ?? fallbackCreationDate,
  };
}

function parseIds(args: readonly string[]): readonly number[] | string {
  if (args.length === 0) {
    return "Error: expected at least one task id.";
  }

  const ids = args.map(Number);
  return ids.every((id) => Number.isInteger(id) && id > 0)
    ? ids
    : "Error: expected task id.";
}

function updateMany(
  todos: readonly string[],
  idTexts: readonly string[],
  update: (task: TodoTask, id: number) => TodoTask | TaskUpdate | string,
): TodoCommandResult {
  const ids = parseIds(idTexts);

  if (typeof ids === "string") {
    return { nextTodos: todos, output: ids };
  }

  let nextTodos = [...todos];
  const outputs: string[] = [];

  ids.forEach((id) => {
    const found = findTask(nextTodos, String(id));
    if (typeof found === "string") {
      outputs.push(found);
      return;
    }

    const result = update(found.task, id);
    if (typeof result === "string") {
      outputs.push(result);
      return;
    }

    const updated = "task" in result ? result.task : result;
    nextTodos = replaceAt(nextTodos, found.index, updated) as string[];
    outputs.push(
      "task" in result && result.output
        ? result.output
        : `Updated: ${taskLabel(updated)}`,
    );
  });

  return { nextTodos, output: outputs.join("\n") || undefined };
}

function formatTask(id: number, task: TodoTask): string {
  const priority =
    task.priority && !task.completed ? `(${task.priority}) ` : "";
  return `${id}. ${priority}${taskLabel(task)}`;
}

function compareTasks(a: IndexedTask, b: IndexedTask): number {
  const aDue = getMetadataValue(a.task.metadata, "due");
  const bDue = getMetadataValue(b.task.metadata, "due");

  if (aDue && bDue && aDue !== bDue) return aDue.localeCompare(bDue);
  if (aDue) return -1;
  if (bDue) return 1;
  if (
    a.task.priority &&
    b.task.priority &&
    a.task.priority !== b.task.priority
  ) {
    return a.task.priority.localeCompare(b.task.priority);
  }
  if (a.task.priority) return -1;
  if (b.task.priority) return 1;
  return a.id - b.id;
}

function getMetadataValue(
  metadata: readonly TodoMetadata[],
  key: string,
): string | undefined {
  return metadata.find((item) => item.key === key)?.value;
}

function incompleteTasks(todos: readonly string[]): readonly IndexedTask[] {
  return parseTasks(todos)
    .filter(({ task }) => !task.completed)
    .sort(compareTasks);
}

function completedTasks(todos: readonly string[]): readonly IndexedTask[] {
  return parseTasks(todos).filter(({ task }) => task.completed);
}

function formatTaskList(
  tasks: readonly IndexedTask[],
  emptyMessage: string,
): string {
  return tasks.length === 0
    ? emptyMessage
    : tasks.map(({ id, task }) => formatTask(id, task)).join("\n");
}

function runAdd(
  todos: readonly string[],
  commandText: string,
  clock: TodoClock,
): TodoCommandResult {
  const text = commandText.trim();

  if (text === "") {
    return { nextTodos: todos, output: "Error: add requires task text." };
  }

  const parsed = parseTodoLine(text);
  const task = parsed.ok ? taskFromInput(text, clock.today()) : undefined;
  const line = task ? serializeTodo(task) : `${clock.today()} ${text}`;

  return {
    nextTodos: [...todos, line],
    output: `Added: ${todos.length + 1}. ${
      task ? formatTask(todos.length + 1, task).replace(/^\d+\. /, "") : text
    }`,
  };
}

function runEdit(
  todos: readonly string[],
  args: readonly string[],
): TodoCommandResult {
  const [idText, ...textParts] = args;
  const found = findTask(todos, idText);

  if (typeof found === "string") {
    return { nextTodos: todos, output: found };
  }

  if (textParts.length === 0) {
    return { nextTodos: todos, output: "Usage: edit <id> <text>." };
  }

  const text = textParts.join(" ");
  const existing = found.task;
  const nextTask = taskFromInput(text, existing.creationDate ?? "") ?? {
    ...existing,
    priority: undefined,
    text,
    projects: [],
    contexts: [],
    metadata: [],
  };

  return {
    nextTodos: replaceAt(todos, found.index, nextTask),
    output: `Updated: ${taskLabel(nextTask)}`,
  };
}

function runShow(
  todos: readonly string[],
  idText: string | undefined,
): TodoCommandResult {
  const found = findTask(todos, idText);

  if (typeof found === "string") {
    return { nextTodos: todos, output: found };
  }

  const due = getMetadataValue(found.task.metadata, "due") ?? "-";
  const priority = found.task.priority ?? "-";
  const created = found.task.creationDate ?? "-";
  const status = found.task.completed ? "complete" : "open";

  return {
    nextTodos: todos,
    output: `${taskLabel(found.task)}\ncreated: ${created}  priority: ${priority}  due: ${due}  status: ${status}`,
  };
}

function runDelete(
  todos: readonly string[],
  idTexts: readonly string[],
): TodoCommandResult {
  const ids = parseIds(idTexts);

  if (typeof ids === "string") {
    return { nextTodos: todos, output: ids };
  }

  const outputs: string[] = [];
  const removeIndexes = new Set<number>();

  ids.forEach((id) => {
    const found = findTask(todos, String(id));
    if (typeof found === "string") {
      outputs.push(found);
      return;
    }

    removeIndexes.add(found.index);
    outputs.push(`Deleted: ${taskLabel(found.task)}`);
    if (!found.task.completed) {
      outputs.push("Warning: task was not marked complete - deleted anyway.");
    }
  });

  return {
    nextTodos: todos.filter((_, index) => !removeIndexes.has(index)),
    output: outputs.join("\n"),
  };
}

function runComplete(
  todos: readonly string[],
  idTexts: readonly string[],
  clock: TodoClock,
): TodoCommandResult {
  return updateMany(todos, idTexts, (task) => {
    if (task.completed) {
      return "Warning: already marked complete.";
    }

    const text =
      task.priority === undefined
        ? task.text
        : addOrReplaceMetadata(task.text, "pri", task.priority);

    const completedLine = `x ${clock.today()} ${task.creationDate ?? ""} ${text}`;
    const parsed = parseTodoLine(completedLine);
    const completedTask = {
      ...task,
      completed: true,
      priority: task.priority,
      completionDate: clock.today(),
      text,
      metadata: parsed.ok ? parsed.task.metadata : task.metadata,
    };

    return {
      task: completedTask,
      output: `Completed: ${taskLabel(completedTask)}`,
    };
  });
}

function runUndo(
  todos: readonly string[],
  idTexts: readonly string[],
): TodoCommandResult {
  return updateMany(todos, idTexts, (task) => {
    if (!task.completed) {
      return "Warning: not marked complete.";
    }

    const restoredPriority =
      getMetadataValue(task.metadata, "pri") ?? task.priority;
    const text = removeMetadata(task.text, "pri");
    const parsed = parseTodoLine(text);

    const reopenedTask = {
      ...task,
      completed: false,
      completionDate: undefined,
      priority: restoredPriority,
      text,
      projects: parsed.ok ? parsed.task.projects : task.projects,
      contexts: parsed.ok ? parsed.task.contexts : task.contexts,
      metadata: parsed.ok ? parsed.task.metadata : task.metadata,
    };

    return {
      task: reopenedTask,
      output: `Reopened: ${taskLabel(reopenedTask)}`,
    };
  });
}

function runDue(
  todos: readonly string[],
  args: readonly string[],
): TodoCommandResult {
  const [idText, date] = args;

  if (!isTodoDate(date ?? "")) {
    return {
      nextTodos: todos,
      output: `Error: invalid date "${date ?? ""}" - expected YYYY-MM-DD.`,
    };
  }

  return updateMany(todos, [idText ?? ""], (task) => {
    const text = addOrReplaceMetadata(task.text, "due", date);
    const parsed = parseTodoLine(text);
    return {
      task: {
        ...task,
        text,
        metadata: parsed.ok ? parsed.task.metadata : task.metadata,
      },
      output: `Updated: due:${date}`,
    };
  });
}

function runPriority(
  todos: readonly string[],
  args: readonly string[],
): TodoCommandResult {
  const [idText, priority] = args;

  if (!PRIORITY_PATTERN.test(priority ?? "")) {
    return {
      nextTodos: todos,
      output: `Error: invalid priority "${priority ?? ""}" - expected a single letter A-Z.`,
    };
  }

  return updateMany(todos, [idText ?? ""], (task) => ({
    task: {
      ...task,
      priority,
    },
    output: `Updated: priority set to (${priority})`,
  }));
}

function runTag(
  todos: readonly string[],
  args: readonly string[],
): TodoCommandResult {
  const [idText, ...tags] = args;
  const invalid = tags.find((tag) => !CONTEXT_PATTERN.test(tag));

  if (tags.length === 0 || invalid) {
    return { nextTodos: todos, output: "Error: expected @tag." };
  }

  return updateMany(todos, [idText ?? ""], (task) => {
    const text = addUniqueTokens(task.text, tags);
    const parsed = parseTodoLine(text);
    return {
      task: {
        ...task,
        text,
        contexts: parsed.ok ? parsed.task.contexts : task.contexts,
      },
      output: `Updated: added ${tags.join(" ")}`,
    };
  });
}

function runProject(
  todos: readonly string[],
  args: readonly string[],
): TodoCommandResult {
  const [idText, project] = args;

  if (!PROJECT_PATTERN.test(project ?? "")) {
    return { nextTodos: todos, output: "Error: expected +Project." };
  }

  return updateMany(todos, [idText ?? ""], (task) => {
    const text = addUniqueTokens(task.text, [project]);
    const parsed = parseTodoLine(text);
    return {
      task: {
        ...task,
        text,
        projects: parsed.ok ? parsed.task.projects : task.projects,
      },
      output: `Updated: assigned to ${project}`,
    };
  });
}

function runClear(
  todos: readonly string[],
  args: readonly string[],
): TodoCommandResult {
  const [target, ...rest] = args;

  if (target === "due") {
    return updateMany(todos, rest, (task) => {
      const text = removeMetadata(task.text, "due");
      const parsed = parseTodoLine(text);
      return {
        ...task,
        text,
        metadata: parsed.ok ? parsed.task.metadata : task.metadata,
      };
    });
  }

  if (target === "priority") {
    return updateMany(todos, rest, (task) => ({
      ...task,
      priority: undefined,
    }));
  }

  if (target === "tags") {
    const [idText, ...tags] = rest;
    const tagSet = new Set(tags);
    return updateMany(todos, [idText ?? ""], (task) => {
      const text = removeTokens(
        task.text,
        (word) =>
          CONTEXT_PATTERN.test(word) && (tagSet.size === 0 || tagSet.has(word)),
      );
      const parsed = parseTodoLine(text);
      return { ...task, text, contexts: parsed.ok ? parsed.task.contexts : [] };
    });
  }

  if (target === "project") {
    return updateMany(todos, rest, (task) => {
      const text = removeTokens(task.text, (word) =>
        PROJECT_PATTERN.test(word),
      );
      const parsed = parseTodoLine(text);
      return { ...task, text, projects: parsed.ok ? parsed.task.projects : [] };
    });
  }

  return {
    nextTodos: todos,
    output: "Error: clear expects due, priority, tags, or project.",
  };
}

function runList(
  todos: readonly string[],
  filterText: string,
  today: string,
): TodoCommandResult {
  const trimmedFilter = filterText.trim();
  const isQuotedKeyword = /^".*"$/.test(trimmedFilter);
  const filter = trimmedFilter.replace(/^"|"$/g, "");

  if (!isQuotedKeyword) {
    switch (filter) {
      case "today":
        return runToday(todos, today);
      case "upcoming":
        return runUpcoming(todos, today);
      case "inbox":
        return runInbox(todos);
      case "someday":
        return runSomeday(todos);
    }
  }

  const tasks = incompleteTasks(todos).filter(({ task }) => {
    if (filter === "") return true;
    if (filter.startsWith("+")) return task.projects.includes(filter.slice(1));
    if (filter.startsWith("@")) return task.contexts.includes(filter.slice(1));
    return task.text.toLowerCase().includes(filter.toLowerCase());
  });

  return {
    nextTodos: todos,
    output: formatTaskList(
      tasks,
      filter === ""
        ? "No incomplete tasks."
        : `No incomplete tasks match "${filter}".`,
    ),
  };
}

function runToday(todos: readonly string[], today: string): TodoCommandResult {
  const tasks = incompleteTasks(todos).filter(({ task }) => {
    const due = getMetadataValue(task.metadata, "due");
    return due !== undefined && due <= today;
  });

  return { nextTodos: todos, output: formatTaskList(tasks, "Today is clear.") };
}

function runUpcoming(
  todos: readonly string[],
  today: string,
): TodoCommandResult {
  const tasks = incompleteTasks(todos).filter(({ task }) => {
    const due = getMetadataValue(task.metadata, "due");
    return due !== undefined && due > today;
  });

  return {
    nextTodos: todos,
    output: formatTaskList(tasks, "Upcoming is empty."),
  };
}

function runInbox(todos: readonly string[]): TodoCommandResult {
  const tasks = incompleteTasks(todos).filter(
    ({ task }) =>
      task.projects.length === 0 && !getMetadataValue(task.metadata, "due"),
  );

  return { nextTodos: todos, output: formatTaskList(tasks, "Inbox is empty.") };
}

function runSomeday(todos: readonly string[]): TodoCommandResult {
  const tasks = incompleteTasks(todos).filter(
    ({ task }) =>
      task.projects.length > 0 && !getMetadataValue(task.metadata, "due"),
  );

  return {
    nextTodos: todos,
    output: formatTaskList(tasks, "Someday is empty."),
  };
}

function runProjects(todos: readonly string[]): TodoCommandResult {
  const counts = new Map<string, number>();

  incompleteTasks(todos).forEach(({ task }) => {
    task.projects.forEach((project) => {
      counts.set(project, (counts.get(project) ?? 0) + 1);
    });
  });

  const rows = [...counts.entries()].sort((a, b) => b[1] - a[1]);

  if (rows.length === 0) {
    return { nextTodos: todos, output: "No projects." };
  }

  const total = rows.reduce((sum, [, count]) => sum + count, 0);

  return {
    nextTodos: todos,
    output: [
      `${rows.length} projects, ${total} tasks between them.`,
      ...rows.map(([project, count]) => `${count} +${project}`),
    ].join("\n"),
  };
}

function runStats(todos: readonly string[], today: string): TodoCommandResult {
  const open = incompleteTasks(todos);
  const completed = completedTasks(todos);
  const overdue = open.filter(({ task }) => {
    const due = getMetadataValue(task.metadata, "due");
    return due !== undefined && due < today;
  }).length;
  const dueToday = open.filter(
    ({ task }) => getMetadataValue(task.metadata, "due") === today,
  ).length;
  const upcoming = open.filter(({ task }) => {
    const due = getMetadataValue(task.metadata, "due");
    return due !== undefined && due > today;
  }).length;
  const someday = open.filter(
    ({ task }) =>
      task.projects.length > 0 && !getMetadataValue(task.metadata, "due"),
  ).length;

  return {
    nextTodos: todos,
    output: [
      `${open.length} tasks on your radar right now.`,
      `${overdue} overdue`,
      `${dueToday} due today`,
      `${upcoming} on the horizon`,
      `${someday} parked in someday`,
      `${completed.length} wrapped up`,
    ].join("\n"),
  };
}

export function runTodoCommand(
  command: string,
  state: TodoCommandState,
  clock: TodoClock = defaultClock,
): TodoCommandResult {
  const trimmedCommand = command.trim();

  if (trimmedCommand === "") {
    return { nextTodos: state.todos, output: undefined };
  }

  if (trimmedCommand === "help") {
    return { nextTodos: state.todos, output: HELP_TEXT };
  }

  const [commandName, ...args] = trimmedCommand.split(/\s+/);

  switch (commandName) {
    case "add":
      return runAdd(state.todos, trimmedCommand.slice(3), clock);
    case "edit":
      return runEdit(state.todos, args);
    case "show":
      return runShow(state.todos, args[0]);
    case "delete":
      return runDelete(state.todos, args);
    case "complete":
      return runComplete(state.todos, args, clock);
    case "undo":
      return runUndo(state.todos, args);
    case "due":
      return runDue(state.todos, args);
    case "priority":
      return runPriority(state.todos, args);
    case "tag":
      return runTag(state.todos, args);
    case "project":
      return runProject(state.todos, args);
    case "clear":
      return runClear(state.todos, args);
    case "list":
      return runList(state.todos, args.join(" "), clock.today());
    case "today":
      return runToday(state.todos, clock.today());
    case "upcoming":
      return runUpcoming(state.todos, clock.today());
    case "inbox":
      return runInbox(state.todos);
    case "someday":
      return runSomeday(state.todos);
    case "archive":
      return {
        nextTodos: state.todos,
        output: formatTaskList(
          completedTasks(state.todos),
          "Archive is empty.",
        ),
      };
    case "projects":
      return runProjects(state.todos);
    case "stats":
      return runStats(state.todos, clock.today());
    case "donate":
      return {
        nextTodos: state.todos,
        output: `headway is free and always will be. ♥\nIf it's saved you time, you can buy the maintainers a coffee:\n${window.location.origin}/donate`,
      };
    default:
      return {
        nextTodos: state.todos,
        output: `${commandName} is not a recognized command. Type 'help' for all available commands.`,
      };
  }
}
