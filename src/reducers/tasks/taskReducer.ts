import type { Task, TaskAction, TaskState } from "@reducers/tasks/taskTypes";

export const createTaskState = (tasks: readonly Task[] = []): TaskState => ({
  tasks,
});

const updateTask = (
  tasks: readonly Task[],
  taskId: string,
  updater: (task: Task) => Task
): readonly Task[] =>
  tasks.map((task) => (task.id === taskId ? updater(task) : task));

export const taskReducer = (
  state: TaskState,
  action: TaskAction
): TaskState => {
  switch (action.type) {
    case "task/add":
      return { tasks: [...state.tasks, action.task] };
    case "task/edit":
      return {
        tasks: updateTask(state.tasks, action.taskId, (task) => ({
          ...task,
          title: action.title,
        })),
      };
    case "task/complete":
      return {
        tasks: updateTask(state.tasks, action.taskId, (task) => {
          if (task.status === "completed") {
            return task;
          }

          return {
            ...task,
            status: "completed",
            completedAt: action.completedAt,
          };
        }),
      };
    case "task/delete":
      return {
        tasks: state.tasks.filter((task) => task.id !== action.taskId),
      };
    case "task/move":
      return {
        tasks: updateTask(state.tasks, action.taskId, (task) => ({
          ...task,
          bucket: action.bucket,
        })),
      };
    case "task/setPriority":
      return {
        tasks: updateTask(state.tasks, action.taskId, (task) => ({
          ...task,
          priority: action.priority,
        })),
      };
    case "task/setDueDate":
      return {
        tasks: updateTask(state.tasks, action.taskId, (task) => ({
          ...task,
          dueDate: action.dueDate,
        })),
      };
    default: {
      const exhaustiveCheck: never = action;
      throw new Error(`Unhandled task action: ${exhaustiveCheck}`);
    }
  }
};
