import { parseTodoLine } from "./parser";
import type { TodoMetadata, TodoTask } from "./types";

/** Parsed task paired with its one-based line id in the todo file. */
export type IndexedTask = {
  readonly id: number;
  readonly task: TodoTask;
};

/**
 * Parses all valid todo lines and keeps their source line ids.
 *
 * @param todos - Raw todo.txt lines.
 * @returns Parsed tasks with one-based ids.
 */
export function parseTasks(todos: readonly string[]): readonly IndexedTask[] {
  return todos.flatMap((line, index) => {
    const result = parseTodoLine(line);
    return result.ok ? [{ id: index + 1, task: result.task }] : [];
  });
}

/**
 * Finds a metadata value by key.
 *
 * @param metadata - Parsed metadata entries.
 * @param key - Metadata key to find.
 * @returns The matching value, or undefined.
 */
export function getMetadataValue(
  metadata: readonly TodoMetadata[],
  key: string,
): string | undefined {
  return metadata.find((item) => item.key === key)?.value;
}

/**
 * Selects a singular or plural label for a count.
 *
 * @param count - Count to inspect.
 * @param singular - Label for one item.
 * @param plural - Label for all other counts.
 * @returns The label that matches the count.
 */
export function pluralize(
  count: number,
  singular: string,
  plural: string,
): string {
  return count === 1 ? singular : plural;
}

/**
 * Returns display text for a task without stored priority metadata noise.
 *
 * @param task - Task to format.
 * @returns Compact task text for terminal display.
 */
export function taskLabel(task: TodoTask): string {
  return task.text
    .replace(/\s+pri:[^:\s]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Formats a task body with active priority when present.
 *
 * @param task - Task to format.
 * @returns Display body without the numeric id.
 */
export function formatTaskBody(task: TodoTask): string {
  const priority =
    task.priority && !task.completed ? `(${task.priority}) ` : "";
  return `${priority}${taskLabel(task)}`;
}

/**
 * Formats a numbered task row.
 *
 * @param id - One-based display id.
 * @param task - Task to format.
 * @returns Numbered task text.
 */
export function formatTask(id: number, task: TodoTask): string {
  return `${id}. ${formatTaskBody(task)}`;
}

/**
 * Formats a task section and returns the source ids used by later commands.
 *
 * @param tasks - Tasks in display order.
 * @param startPosition - First visible id in the section.
 * @returns Display lines and source todo ids.
 */
export function formatSection(
  tasks: readonly IndexedTask[],
  startPosition: number,
): { readonly lines: readonly string[]; readonly ids: readonly number[] } {
  return {
    lines: tasks.map((t, i) => formatTask(startPosition + i, t.task)),
    ids: tasks.map((t) => t.id),
  };
}
