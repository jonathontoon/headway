import { parseTodoLine } from "./parser";
import type { TodoMetadata, TodoTask } from "./types";

export type IndexedTask = {
  readonly id: number;
  readonly task: TodoTask;
};

export function parseTasks(todos: readonly string[]): readonly IndexedTask[] {
  return todos.flatMap((line, index) => {
    const result = parseTodoLine(line);
    return result.ok ? [{ id: index + 1, task: result.task }] : [];
  });
}

export function getMetadataValue(
  metadata: readonly TodoMetadata[],
  key: string,
): string | undefined {
  return metadata.find((item) => item.key === key)?.value;
}

export function pluralize(
  count: number,
  singular: string,
  plural: string,
): string {
  return count === 1 ? singular : plural;
}

export function taskLabel(task: TodoTask): string {
  return task.text
    .replace(/\s+pri:[^:\s]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function formatTaskBody(task: TodoTask): string {
  const priority =
    task.priority && !task.completed ? `(${task.priority}) ` : "";
  return `${priority}${taskLabel(task)}`;
}

export function formatTask(id: number, task: TodoTask): string {
  return `${id}. ${formatTaskBody(task)}`;
}

export function formatSection(
  tasks: readonly IndexedTask[],
  startPosition: number,
): { readonly lines: readonly string[]; readonly ids: readonly number[] } {
  return {
    lines: tasks.map((t, i) => formatTask(startPosition + i, t.task)),
    ids: tasks.map((t) => t.id),
  };
}
