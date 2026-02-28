import type {
  Task,
  TaskAction,
  TaskBucket,
  TaskPriority,
} from "@reducers/tasks/taskTypes";

const nowIso = (): string => new Date().toISOString();

export const createTask = (title: string, createdAt = nowIso()): Task => ({
  id: crypto.randomUUID(),
  title: title.trim(),
  notes: "",
  status: "active",
  bucket: "inbox",
  priority: null,
  dueDate: null,
  project: null,
  context: null,
  createdAt,
  completedAt: null,
});

export const addTask = (title: string, createdAt?: string): TaskAction => ({
  type: "task/add",
  task: createTask(title, createdAt),
});

export const editTask = (taskId: string, title: string): TaskAction => ({
  type: "task/edit",
  taskId,
  title: title.trim(),
});

export const completeTask = (
  taskId: string,
  completedAt = nowIso()
): TaskAction => ({
  type: "task/complete",
  taskId,
  completedAt,
});

export const deleteTask = (taskId: string): TaskAction => ({
  type: "task/delete",
  taskId,
});

export const moveTask = (taskId: string, bucket: TaskBucket): TaskAction => ({
  type: "task/move",
  taskId,
  bucket,
});

export const setTaskPriority = (
  taskId: string,
  priority: TaskPriority | null
): TaskAction => ({
  type: "task/setPriority",
  taskId,
  priority,
});

export const setTaskDueDate = (
  taskId: string,
  dueDate: string | null
): TaskAction => ({
  type: "task/setDueDate",
  taskId,
  dueDate,
});
