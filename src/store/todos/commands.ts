import { HELP_TEXT } from "../../constants";
import {
  formatSection,
  formatTaskBody,
  getMetadataValue,
  parseTasks,
  taskLabel,
  type IndexedTask,
} from "./format";
import { isTodoDate, parseTodoLine, serializeTodo } from "./parser";
import type {
  TodoClock,
  TodoCommandResult,
  TodoCommandState,
  TodoTask,
} from "./types";

const PRIORITY_PATTERN = /^[A-Z]$/;
const CONTEXT_PATTERN = /^@\S+$/;
const PROJECT_PATTERN = /^\+\S+$/;

type TaskUpdate = {
  readonly task: TodoTask;
  readonly output?: string;
};

const NO_LIST_ERROR = "Error: no task list is showing - run 'list' first.";

const defaultClock: TodoClock = {
  today: () => {
    const date = new Date();
    const offsetMs = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - offsetMs).toISOString().slice(0, 10);
  },
};

function findTask(
  state: TodoCommandState,
  idText: string | undefined,
): { readonly index: number; readonly task: TodoTask } | string {
  const position = Number(idText);

  if (!Number.isInteger(position) || position < 1) {
    return "Error: no task with that id.";
  }

  if (state.view.length === 0) {
    return NO_LIST_ERROR;
  }

  const lineNumber = state.view[position - 1];
  if (lineNumber === undefined || lineNumber > state.todos.length) {
    return "Error: no task with that id.";
  }

  const result = parseTodoLine(state.todos[lineNumber - 1]);
  if (!result.ok) {
    return `Error: task ${position} is not valid todo.txt.`;
  }

  return { index: lineNumber - 1, task: result.task };
}

function replaceAt(
  todos: readonly string[],
  index: number,
  task: TodoTask,
): readonly string[] {
  return todos.map((todo, i) => (i === index ? serializeTodo(task) : todo));
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
  state: TodoCommandState,
  idTexts: readonly string[],
  update: (task: TodoTask, id: number) => TodoTask | TaskUpdate | string,
): TodoCommandResult {
  const ids = parseIds(idTexts);

  if (typeof ids === "string") {
    return { nextTodos: state.todos, output: ids };
  }

  if (state.view.length === 0) {
    return { nextTodos: state.todos, output: NO_LIST_ERROR };
  }

  let nextTodos = [...state.todos];
  const outputs: string[] = [];

  ids.forEach((id) => {
    const found = findTask({ todos: nextTodos, view: state.view }, String(id));
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

function compareTasks(a: IndexedTask, b: IndexedTask): number {
  // Sort by priority first (A-Z, with no priority at the end)
  if (
    a.task.priority &&
    b.task.priority &&
    a.task.priority !== b.task.priority
  ) {
    return a.task.priority.localeCompare(b.task.priority);
  }
  if (a.task.priority) return -1;
  if (b.task.priority) return 1;

  // Then by due date
  const aDue = getMetadataValue(a.task.metadata, "due");
  const bDue = getMetadataValue(b.task.metadata, "due");

  if (aDue && bDue && aDue !== bDue) return aDue.localeCompare(bDue);
  if (aDue) return -1;
  if (bDue) return 1;

  // Finally by original order
  return a.id - b.id;
}

function incompleteTasks(todos: readonly string[]): readonly IndexedTask[] {
  return parseTasks(todos)
    .filter(({ task }) => !task.completed)
    .sort(compareTasks);
}

function completedTasks(todos: readonly string[]): readonly IndexedTask[] {
  return parseTasks(todos).filter(({ task }) => task.completed);
}

function buildListing(
  tasks: readonly IndexedTask[],
  emptyMessage: string,
): { readonly output: string; readonly view: readonly number[] } {
  if (tasks.length === 0) {
    return { output: emptyMessage, view: [] };
  }

  const { lines, ids } = formatSection(tasks, 1);
  return { output: lines.join("\n"), view: ids };
}

function runAdd(
  state: TodoCommandState,
  commandText: string,
  clock: TodoClock,
): TodoCommandResult {
  const text = commandText.trim();

  if (text === "") {
    return {
      nextTodos: state.todos,
      output: "Error: add requires task text.",
    };
  }

  const parsed = parseTodoLine(text);
  const task = parsed.ok ? taskFromInput(text, clock.today()) : undefined;
  const line = task ? serializeTodo(task) : `${clock.today()} ${text}`;

  return {
    nextTodos: [...state.todos, line],
    output: `Added: ${task ? formatTaskBody(task) : text}`,
  };
}

function runEdit(
  state: TodoCommandState,
  args: readonly string[],
): TodoCommandResult {
  const [idText, ...textParts] = args;
  const found = findTask(state, idText);

  if (typeof found === "string") {
    return { nextTodos: state.todos, output: found };
  }

  if (textParts.length === 0) {
    return { nextTodos: state.todos, output: "Usage: edit <#> <text>." };
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
    nextTodos: replaceAt(state.todos, found.index, nextTask),
    output: `Updated: ${taskLabel(nextTask)}`,
  };
}

function runShow(
  state: TodoCommandState,
  idText: string | undefined,
): TodoCommandResult {
  const found = findTask(state, idText);

  if (typeof found === "string") {
    return { nextTodos: state.todos, output: found };
  }

  const due = getMetadataValue(found.task.metadata, "due") ?? "-";
  const priority = found.task.priority ?? "-";
  const created = found.task.creationDate ?? "-";
  const status = found.task.completed ? "complete" : "open";

  return {
    nextTodos: state.todos,
    output: `${taskLabel(found.task)}\ncreated: ${created}  priority: ${priority}  due: ${due}  status: ${status}`,
  };
}

function runDelete(
  state: TodoCommandState,
  idTexts: readonly string[],
): TodoCommandResult {
  const ids = parseIds(idTexts);

  if (typeof ids === "string") {
    return { nextTodos: state.todos, output: ids };
  }

  if (state.view.length === 0) {
    return { nextTodos: state.todos, output: NO_LIST_ERROR };
  }

  const outputs: string[] = [];
  const removeIndexes = new Set<number>();

  ids.forEach((id) => {
    const found = findTask(state, String(id));
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
    nextTodos: state.todos.filter((_, index) => !removeIndexes.has(index)),
    output: outputs.join("\n"),
    view: removeIndexes.size > 0 ? [] : undefined,
  };
}

function runComplete(
  state: TodoCommandState,
  idTexts: readonly string[],
  clock: TodoClock,
): TodoCommandResult {
  return updateMany(state, idTexts, (task) => {
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
  state: TodoCommandState,
  idTexts: readonly string[],
): TodoCommandResult {
  return updateMany(state, idTexts, (task) => {
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
  state: TodoCommandState,
  args: readonly string[],
): TodoCommandResult {
  const [idText, date] = args;

  if (!isTodoDate(date ?? "")) {
    return {
      nextTodos: state.todos,
      output: `Error: invalid date "${date ?? ""}" - expected YYYY-MM-DD.`,
    };
  }

  return updateMany(state, [idText ?? ""], (task) => {
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
  state: TodoCommandState,
  args: readonly string[],
): TodoCommandResult {
  const [idText, priority] = args;

  if (!PRIORITY_PATTERN.test(priority ?? "")) {
    return {
      nextTodos: state.todos,
      output: `Error: invalid priority "${priority ?? ""}" - expected a single letter A-Z.`,
    };
  }

  return updateMany(state, [idText ?? ""], (task) => ({
    task: {
      ...task,
      priority,
    },
    output: `Updated: priority set to (${priority})`,
  }));
}

function runTag(
  state: TodoCommandState,
  args: readonly string[],
): TodoCommandResult {
  const [idText, ...tags] = args;
  const invalid = tags.find((tag) => !CONTEXT_PATTERN.test(tag));

  if (tags.length === 0 || invalid) {
    return { nextTodos: state.todos, output: "Error: expected @tag." };
  }

  return updateMany(state, [idText ?? ""], (task) => {
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
  state: TodoCommandState,
  args: readonly string[],
): TodoCommandResult {
  const [idText, project] = args;

  if (!PROJECT_PATTERN.test(project ?? "")) {
    return { nextTodos: state.todos, output: "Error: expected +Project." };
  }

  return updateMany(state, [idText ?? ""], (task) => {
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
  state: TodoCommandState,
  args: readonly string[],
): TodoCommandResult {
  const [target, ...rest] = args;

  if (target === "due") {
    return updateMany(state, rest, (task) => {
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
    return updateMany(state, rest, (task) => ({
      ...task,
      priority: undefined,
    }));
  }

  if (target === "tags") {
    const [idText, ...tags] = rest;
    const tagSet = new Set(tags);
    return updateMany(state, [idText ?? ""], (task) => {
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
    return updateMany(state, rest, (task) => {
      const text = removeTokens(task.text, (word) =>
        PROJECT_PATTERN.test(word),
      );
      const parsed = parseTodoLine(text);
      return { ...task, text, projects: parsed.ok ? parsed.task.projects : [] };
    });
  }

  return {
    nextTodos: state.todos,
    output: "Error: clear expects due, priority, tags, or project.",
  };
}

function runList(
  state: TodoCommandState,
  filterText: string,
  today: string,
): TodoCommandResult {
  const trimmedFilter = filterText.trim();
  const isQuotedKeyword = /^".*"$/.test(trimmedFilter);
  const filter = trimmedFilter.replace(/^"|"$/g, "");

  if (!isQuotedKeyword) {
    switch (filter) {
      case "today":
        return runToday(state, today);
      case "upcoming":
        return runUpcoming(state, today);
      case "inbox":
        return runInbox(state);
      case "someday":
        return runSomeday(state);
    }
  }

  const tasks = incompleteTasks(state.todos).filter(({ task }) => {
    if (filter === "") return true;
    if (filter.startsWith("+")) return task.projects.includes(filter.slice(1));
    if (filter.startsWith("@")) return task.contexts.includes(filter.slice(1));
    return task.text.toLowerCase().includes(filter.toLowerCase());
  });

  const { output, view } = buildListing(
    tasks,
    filter === ""
      ? "No incomplete tasks."
      : `No incomplete tasks match "${filter}".`,
  );

  return { nextTodos: state.todos, output, view };
}

function runToday(state: TodoCommandState, today: string): TodoCommandResult {
  const tasks = incompleteTasks(state.todos).filter(({ task }) => {
    const due = getMetadataValue(task.metadata, "due");
    return due !== undefined && due <= today;
  });

  const { output, view } = buildListing(tasks, "Today is clear.");
  return { nextTodos: state.todos, output, view };
}

function runUpcoming(
  state: TodoCommandState,
  today: string,
): TodoCommandResult {
  const tasks = incompleteTasks(state.todos).filter(({ task }) => {
    const due = getMetadataValue(task.metadata, "due");
    return due !== undefined && due > today;
  });

  const { output, view } = buildListing(tasks, "Upcoming is empty.");
  return { nextTodos: state.todos, output, view };
}

function runInbox(state: TodoCommandState): TodoCommandResult {
  const tasks = incompleteTasks(state.todos).filter(
    ({ task }) =>
      task.projects.length === 0 && !getMetadataValue(task.metadata, "due"),
  );

  const { output, view } = buildListing(tasks, "Inbox is empty.");
  return { nextTodos: state.todos, output, view };
}

function runSomeday(state: TodoCommandState): TodoCommandResult {
  const tasks = incompleteTasks(state.todos).filter(
    ({ task }) =>
      task.projects.length > 0 && !getMetadataValue(task.metadata, "due"),
  );

  const { output, view } = buildListing(tasks, "Someday is empty.");
  return { nextTodos: state.todos, output, view };
}

function runProjects(state: TodoCommandState): TodoCommandResult {
  const counts = new Map<string, number>();

  incompleteTasks(state.todos).forEach(({ task }) => {
    task.projects.forEach((project) => {
      counts.set(project, (counts.get(project) ?? 0) + 1);
    });
  });

  const rows = [...counts.entries()].sort((a, b) => b[1] - a[1]);

  if (rows.length === 0) {
    return { nextTodos: state.todos, output: "No projects." };
  }

  const total = rows.reduce((sum, [, count]) => sum + count, 0);

  return {
    nextTodos: state.todos,
    output: [
      `${rows.length} projects, ${total} tasks between them.`,
      ...rows.map(([project, count]) => `${count} +${project}`),
    ].join("\n"),
  };
}

function runStats(state: TodoCommandState, today: string): TodoCommandResult {
  const open = incompleteTasks(state.todos);
  const completed = completedTasks(state.todos);
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
    nextTodos: state.todos,
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

function runCommand(
  trimmedCommand: string,
  state: TodoCommandState,
  clock: TodoClock,
): TodoCommandResult {
  if (trimmedCommand === "") {
    return { nextTodos: state.todos, output: undefined };
  }

  if (trimmedCommand === "help") {
    return { nextTodos: state.todos, output: HELP_TEXT };
  }

  const [commandName, ...args] = trimmedCommand.split(/\s+/);

  switch (commandName) {
    case "add":
      return runAdd(state, trimmedCommand.slice(3), clock);
    case "edit":
      return runEdit(state, args);
    case "show":
      return runShow(state, args[0]);
    case "delete":
      return runDelete(state, args);
    case "complete":
      return runComplete(state, args, clock);
    case "undo":
      return runUndo(state, args);
    case "due":
      return runDue(state, args);
    case "priority":
      return runPriority(state, args);
    case "tag":
      return runTag(state, args);
    case "project":
      return runProject(state, args);
    case "clear":
      return runClear(state, args);
    case "list":
      return runList(state, args.join(" "), clock.today());
    case "today":
      return runToday(state, clock.today());
    case "upcoming":
      return runUpcoming(state, clock.today());
    case "inbox":
      return runInbox(state);
    case "someday":
      return runSomeday(state);
    case "archive": {
      const { output, view } = buildListing(
        completedTasks(state.todos),
        "Archive is empty.",
      );
      return { nextTodos: state.todos, output, view };
    }
    case "projects":
      return runProjects(state);
    case "stats":
      return runStats(state, clock.today());
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

export function runTodoCommand(
  command: string,
  state: TodoCommandState,
  clock: TodoClock = defaultClock,
): TodoCommandResult {
  const result = runCommand(command.trim(), state, clock);
  return { ...result, view: result.view ?? state.view };
}
