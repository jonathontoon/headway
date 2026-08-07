import { formatSection, getMetadataValue, parseTasks } from "./format";
import type { IndexedTask } from "./format";

type TodoListing = {
  readonly output: string;
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
    return { output: emptyMessage, view: [] };
  }

  const { lines, ids } = formatSection(tasks, 1);
  return { output: lines.join("\n"), view: ids };
}

export function listIncompleteTasks(todos: readonly string[]): TodoListing {
  return buildListing(incompleteTasks(todos), "No incomplete tasks.");
}

export function listCompletedTasks(todos: readonly string[]): TodoListing {
  return buildListing(completedTasks(todos), "Completed is empty.");
}

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

export function filterIncompleteTasks(
  todos: readonly string[],
  predicate: (task: IndexedTask) => boolean,
  emptyMessage: string,
): TodoListing {
  return buildListing(incompleteTasks(todos).filter(predicate), emptyMessage);
}
