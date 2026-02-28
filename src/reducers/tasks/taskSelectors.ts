import type {
  Task,
  TaskBucket,
  TaskState,
  VisibleTask,
  VisibleTaskGroup,
} from "@reducers/tasks/taskTypes";

const BUCKET_ORDER: readonly TaskBucket[] = [
  "inbox",
  "today",
  "upcoming",
  "anytime",
];

const BUCKET_LABELS: Record<TaskBucket, string> = {
  inbox: "Inbox",
  today: "Today",
  upcoming: "Upcoming",
  anytime: "Anytime",
};

const PRIORITY_ORDER: Record<string, number> = {
  A: 0,
  B: 1,
  C: 2,
};

const compareNullableStrings = (left: string | null, right: string | null) => {
  if (left === right) {
    return 0;
  }

  if (left === null) {
    return 1;
  }

  if (right === null) {
    return -1;
  }

  return left.localeCompare(right);
};

export const sortTasks = (tasks: readonly Task[]): Task[] =>
  tasks
    .map((task, index) => ({ task, index }))
    .sort((left, right) => {
      const bucketDiff =
        BUCKET_ORDER.indexOf(left.task.bucket) - BUCKET_ORDER.indexOf(right.task.bucket);
      if (bucketDiff !== 0) {
        return bucketDiff;
      }

      const leftPriority = left.task.priority
        ? PRIORITY_ORDER[left.task.priority]
        : Number.POSITIVE_INFINITY;
      const rightPriority = right.task.priority
        ? PRIORITY_ORDER[right.task.priority]
        : Number.POSITIVE_INFINITY;
      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }

      const dueDateDiff = compareNullableStrings(left.task.dueDate, right.task.dueDate);
      if (dueDateDiff !== 0) {
        return dueDateDiff;
      }

      const createdAtDiff = left.task.createdAt.localeCompare(right.task.createdAt);
      if (createdAtDiff !== 0) {
        return createdAtDiff;
      }

      return left.index - right.index;
    })
    .map(({ task }) => task);

export const getActiveTasks = (tasks: readonly Task[]): Task[] =>
  sortTasks(tasks.filter((task) => task.status === "active"));

export const getVisibleTasks = (
  stateOrTasks: TaskState | readonly Task[]
): VisibleTask[] => {
  const tasks =
    "tasks" in stateOrTasks ? stateOrTasks.tasks : stateOrTasks;

  return getActiveTasks(tasks).map((task, index) => ({
    ...task,
    visibleIndex: index + 1,
  }));
};

export const groupVisibleTasks = (
  visibleTasks: readonly VisibleTask[]
): VisibleTaskGroup[] =>
  BUCKET_ORDER.map((bucket) => ({
    bucket,
    label: BUCKET_LABELS[bucket],
    tasks: visibleTasks.filter((task) => task.bucket === bucket),
  })).filter((group) => group.tasks.length > 0);

export const resolveTaskByTarget = (
  tasks: readonly Task[],
  target: string | number
): Task | null => {
  if (typeof target === "number") {
    return getVisibleTasks(tasks).find((task) => task.visibleIndex === target) ?? null;
  }

  if (/^\d+$/.test(target)) {
    const visibleIndex = Number.parseInt(target, 10);
    return getVisibleTasks(tasks).find((task) => task.visibleIndex === visibleIndex) ?? null;
  }

  return tasks.find((task) => task.id === target) ?? null;
};
