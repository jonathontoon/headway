import { getMetadataValue, parseTasks } from "./format";
import type { IndexedTask } from "./format";
import { terminalOutput, type TerminalOutput } from "../terminal/output";

type TodoListing = {
  readonly output: TerminalOutput;
  readonly view: readonly number[];
};

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
): TodoListing {
  if (tasks.length === 0) {
    return { output: terminalOutput.muted(emptyMessage), view: [] };
  }

  return {
    output: terminalOutput.tasks(
      tasks.map((item, index) => ({ position: index + 1, task: item.task })),
    ),
    view: tasks.map((item) => item.id),
  };
}

/**
 * Builds the default list of incomplete tasks.
 *
 * @param todos - Raw todo.txt lines.
 * @returns Terminal output and the source ids in display order.
 */
export function listIncompleteTasks(todos: readonly string[]): TodoListing {
  return buildListing(incompleteTasks(todos), "No incomplete tasks.");
}

/**
 * Builds the list of completed tasks.
 *
 * @param todos - Raw todo.txt lines.
 * @returns Terminal output and the source ids in display order.
 */
export function listCompletedTasks(todos: readonly string[]): TodoListing {
  return buildListing(completedTasks(todos), "Completed is empty.");
}

/**
 * Builds the list of tasks due today or overdue.
 *
 * @param todos - Raw todo.txt lines.
 * @param today - Current local date in `YYYY-MM-DD` format.
 * @returns Terminal output and the source ids in display order.
 */
export function listTodayTasks(
  todos: readonly string[],
  today: string,
): TodoListing {
  const tasks = incompleteTasks(todos).filter(({ task }) => {
    const due = getMetadataValue(task.metadata, "due");
    return due !== undefined && due <= today;
  });

  return buildListing(tasks, "Today is clear.");
}

/**
 * Builds the list of future-dated tasks.
 *
 * @param todos - Raw todo.txt lines.
 * @param today - Current local date in `YYYY-MM-DD` format.
 * @returns Terminal output and the source ids in display order.
 */
export function listUpcomingTasks(
  todos: readonly string[],
  today: string,
): TodoListing {
  const tasks = incompleteTasks(todos).filter(({ task }) => {
    const due = getMetadataValue(task.metadata, "due");
    return due !== undefined && due > today;
  });

  return buildListing(tasks, "Upcoming is empty.");
}

/**
 * Filters incomplete tasks with a caller-provided predicate.
 *
 * @param todos - Raw todo.txt lines.
 * @param predicate - Function that selects tasks to include.
 * @param emptyMessage - Message to show when no tasks match.
 * @returns Terminal output and the source ids in display order.
 */
export function filterIncompleteTasks(
  todos: readonly string[],
  predicate: (task: IndexedTask) => boolean,
  emptyMessage: string,
): TodoListing {
  return buildListing(incompleteTasks(todos).filter(predicate), emptyMessage);
}
