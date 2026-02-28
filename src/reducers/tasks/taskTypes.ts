export const TASK_BUCKETS = [
  "inbox",
  "today",
  "upcoming",
  "anytime",
] as const;

export type TaskBucket = (typeof TASK_BUCKETS)[number];

export const TASK_PRIORITIES = ["A", "B", "C"] as const;

export type TaskPriority = (typeof TASK_PRIORITIES)[number];
export type TaskStatus = "active" | "completed";

export interface Task {
  id: string;
  title: string;
  notes: string;
  status: TaskStatus;
  bucket: TaskBucket;
  priority: TaskPriority | null;
  dueDate: string | null;
  project: string | null;
  context: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface TaskState {
  tasks: readonly Task[];
}

export interface VisibleTask extends Task {
  visibleIndex: number;
}

export interface VisibleTaskGroup {
  bucket: TaskBucket;
  label: string;
  tasks: readonly VisibleTask[];
}

export type TaskAction =
  | { type: "task/add"; task: Task }
  | { type: "task/edit"; taskId: string; title: string }
  | { type: "task/complete"; taskId: string; completedAt: string }
  | { type: "task/delete"; taskId: string }
  | { type: "task/move"; taskId: string; bucket: TaskBucket }
  | { type: "task/setPriority"; taskId: string; priority: TaskPriority | null }
  | { type: "task/setDueDate"; taskId: string; dueDate: string | null };
