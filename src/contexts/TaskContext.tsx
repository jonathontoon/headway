import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import {
  addTask as addTaskAction,
  completeTask as completeTaskAction,
  deleteTask as deleteTaskAction,
  editTask as editTaskAction,
  moveTask as moveTaskAction,
  setTaskDueDate as setTaskDueDateAction,
  setTaskPriority as setTaskPriorityAction,
} from "@reducers/tasks/taskActions";
import { createTaskState, taskReducer } from "@reducers/tasks/taskReducer";
import {
  getVisibleTasks,
  resolveTaskByTarget,
} from "@reducers/tasks/taskSelectors";
import type {
  Task,
  TaskAction,
  TaskBucket,
  TaskPriority,
  TaskState,
  VisibleTask,
} from "@reducers/tasks/taskTypes";

const STORAGE_KEY = "headway:v2:tasks";

const isTaskBucket = (value: unknown): value is TaskBucket =>
  value === "inbox" ||
  value === "today" ||
  value === "upcoming" ||
  value === "anytime";

const isTaskPriority = (value: unknown): value is TaskPriority =>
  value === "A" || value === "B" || value === "C";

const isTask = (value: unknown): value is Task => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<Task>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.notes === "string" &&
    (candidate.status === "active" || candidate.status === "completed") &&
    isTaskBucket(candidate.bucket) &&
    (candidate.priority === null || isTaskPriority(candidate.priority)) &&
    (candidate.dueDate === null || typeof candidate.dueDate === "string") &&
    (candidate.project === null || typeof candidate.project === "string") &&
    (candidate.context === null || typeof candidate.context === "string") &&
    typeof candidate.createdAt === "string" &&
    (candidate.completedAt === null || typeof candidate.completedAt === "string")
  );
};

const readInitialTasks = (): readonly Task[] => {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isTask);
  } catch {
    return [];
  }
};

const TaskStateContext = createContext<TaskState | null>(null);
const TaskDispatchContext = createContext<Dispatch<TaskAction> | null>(null);

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(taskReducer, undefined, () =>
    createTaskState(readInitialTasks())
  );

  useEffect(() => {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
  }, [state.tasks]);

  return (
    <TaskStateContext.Provider value={state}>
      <TaskDispatchContext.Provider value={dispatch}>
        {children}
      </TaskDispatchContext.Provider>
    </TaskStateContext.Provider>
  );
};

export const useTasksState = (): TaskState => {
  const state = useContext(TaskStateContext);
  if (!state) {
    throw new Error("useTasksState must be used within TaskProvider");
  }

  return state;
};

const useTaskDispatch = (): Dispatch<TaskAction> => {
  const dispatch = useContext(TaskDispatchContext);
  if (!dispatch) {
    throw new Error("useTaskDispatch must be used within TaskProvider");
  }

  return dispatch;
};

const resolveTaskId = (tasks: readonly Task[], target: string | number): string | null =>
  resolveTaskByTarget(tasks, target)?.id ?? null;

export const useVisibleTasks = (): readonly VisibleTask[] => {
  const state = useTasksState();
  return useMemo(() => getVisibleTasks(state), [state.tasks]);
};

export const useTaskActions = () => {
  const state = useTasksState();
  const dispatch = useTaskDispatch();

  return useMemo(
    () => ({
      dispatch,
      resolveTask(target: string | number) {
        return resolveTaskByTarget(state.tasks, target);
      },
      addTask(title: string) {
        dispatch(addTaskAction(title));
      },
      editTask(target: string | number, title: string) {
        const taskId = resolveTaskId(state.tasks, target);
        if (!taskId) {
          return;
        }

        dispatch(editTaskAction(taskId, title));
      },
      completeTask(target: string | number) {
        const taskId = resolveTaskId(state.tasks, target);
        if (!taskId) {
          return;
        }

        dispatch(completeTaskAction(taskId));
      },
      deleteTask(target: string | number) {
        const taskId = resolveTaskId(state.tasks, target);
        if (!taskId) {
          return;
        }

        dispatch(deleteTaskAction(taskId));
      },
      moveTask(target: string | number, bucket: TaskBucket) {
        const taskId = resolveTaskId(state.tasks, target);
        if (!taskId) {
          return;
        }

        dispatch(moveTaskAction(taskId, bucket));
      },
      setTaskPriority(target: string | number, priority: TaskPriority | null) {
        const taskId = resolveTaskId(state.tasks, target);
        if (!taskId) {
          return;
        }

        dispatch(setTaskPriorityAction(taskId, priority));
      },
      setTaskDueDate(target: string | number, dueDate: string | null) {
        const taskId = resolveTaskId(state.tasks, target);
        if (!taskId) {
          return;
        }

        dispatch(setTaskDueDateAction(taskId, dueDate));
      },
    }),
    [dispatch, state.tasks]
  );
};

export const TASK_STORAGE_KEY = STORAGE_KEY;
