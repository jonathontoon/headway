import { parseTodoLine } from "./parser";
import type { TodoMetadata, TodoTask } from "./types";

type IndexedTask = {
  readonly id: number;
  readonly task: TodoTask;
};

function getMetadataValue(
  metadata: readonly TodoMetadata[],
  key: string,
): string | undefined {
  return metadata.find((item) => item.key === key)?.value;
}

function taskLabel(task: TodoTask): string {
  return task.text
    .replace(/\s+pri:[^:\s]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatTask(id: number, task: TodoTask): string {
  const priority =
    task.priority && !task.completed ? `(${task.priority}) ` : "";
  return `${id}. ${priority}${taskLabel(task)}`;
}

function incompleteTasks(todos: readonly string[]): readonly IndexedTask[] {
  return todos.flatMap((line, index) => {
    const result = parseTodoLine(line);

    if (!result.ok || result.task.completed) {
      return [];
    }

    return [{ id: index + 1, task: result.task }];
  });
}

function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

export function getLocalDate(): string {
  const date = new Date();
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 10);
}

export function getTimeGreeting(date = new Date()): string {
  const hour = date.getHours();

  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function formatBootMessage(
  todos: readonly string[],
  today: string,
  greeting: string,
): string {
  const open = incompleteTasks(todos);
  const overdue = open.filter(({ task }) => {
    const due = getMetadataValue(task.metadata, "due");
    return due !== undefined && due < today;
  });
  const dueToday = open.filter(
    ({ task }) => getMetadataValue(task.metadata, "due") === today,
  );
  const inbox = open.filter(
    ({ task }) =>
      task.projects.length === 0 && !getMetadataValue(task.metadata, "due"),
  );
  const lines = [
    "↗ headway v0.1.0",
    `${greeting}. You have ${overdue.length} ${pluralize(
      overdue.length,
      "overdue task",
      "overdue tasks",
    )}, and ${dueToday.length} due today.`,
  ];

  if (overdue.length > 0) {
    lines.push(
      "OVERDUE",
      ...overdue.map(({ id, task }) => formatTask(id, task)),
    );
  }

  if (dueToday.length > 0) {
    lines.push(
      "TODAY",
      ...dueToday.map(({ id, task }) => formatTask(id, task)),
    );
  }

  if (inbox.length > 0) {
    lines.push("INBOX", ...inbox.map(({ id, task }) => formatTask(id, task)));
  }

  lines.push("Type 'help' for all available commands.");

  return lines.join("\n");
}
