import {
  addTask,
  completeTask,
  deleteTask,
  editTask,
  moveTask,
  setTaskDueDate,
  setTaskPriority,
} from "@reducers/tasks/taskActions";
import { taskReducer } from "@reducers/tasks/taskReducer";
import {
  getVisibleTasks,
  resolveTaskByTarget,
} from "@reducers/tasks/taskSelectors";
import type { TaskState, VisibleTask } from "@reducers/tasks/taskTypes";
import { HELP_SECTIONS } from "@reducers/terminal/terminalCatalog";
import { parseCommand } from "@reducers/terminal/terminalParser";
import type {
  CommandExecutionResult,
  TerminalEvent,
  TranscriptEntry,
} from "@reducers/terminal/terminalTypes";

const buildTaskListEvents = (taskState: TaskState): readonly TerminalEvent[] => {
  const visibleTasks = getVisibleTasks(taskState);
  if (visibleTasks.length === 0) {
    return [
      {
        kind: "message",
        level: "info",
        text: "No active tasks.",
      },
    ];
  }

  return [
    {
      kind: "taskList",
      mode: "grouped",
      items: visibleTasks,
    },
  ];
};

const resolveMutableTask = (
  taskState: TaskState,
  target: string
): VisibleTask | null => {
  const visibleTask = resolveTaskByTarget(taskState.tasks, target);
  if (!visibleTask) {
    return null;
  }

  const visible = getVisibleTasks(taskState).find((task) => task.id === visibleTask.id);
  return visible ?? null;
};

const errorResult = (text: string): CommandExecutionResult => ({
  clearTerminal: false,
  entryStatus: "rejected",
  events: [{ kind: "message", level: "error", text }],
  taskAction: null,
});

const successResult = (
  taskState: TaskState,
  message: string,
  taskAction: CommandExecutionResult["taskAction"]
): CommandExecutionResult => {
  const nextTaskState = taskAction ? taskReducer(taskState, taskAction) : taskState;

  return {
    clearTerminal: false,
    entryStatus: "resolved",
    events: [
      { kind: "message", level: "success", text: message },
      ...buildTaskListEvents(nextTaskState),
    ],
    taskAction,
  };
};

export const createTranscriptEntry = (
  command: string | null,
  events: readonly TerminalEvent[],
  status: TranscriptEntry["status"] = "resolved"
): TranscriptEntry => ({
  id: crypto.randomUUID(),
  command,
  status,
  events,
});

export const createWelcomeEntry = (taskState: TaskState): TranscriptEntry => {
  const events: TerminalEvent[] = [
    {
      kind: "message",
      level: "info",
      text: "Welcome to Headway. Type 'help' for commands.",
    },
  ];

  const visibleTasks = getVisibleTasks(taskState);
  if (visibleTasks.length > 0) {
    events.push({
      kind: "taskList",
      mode: "grouped",
      items: visibleTasks,
    });
  }

  return createTranscriptEntry(null, events);
};

export const createPendingEntry = (command: string): TranscriptEntry =>
  createTranscriptEntry(command, [], "pending");

export const executeCommand = (
  raw: string,
  taskState: TaskState
): CommandExecutionResult => {
  const parsed = parseCommand(raw);
  if (!parsed.ok) {
    return errorResult(parsed.error);
  }

  switch (parsed.command.type) {
    case "help":
      return {
        clearTerminal: false,
        entryStatus: "resolved",
        events: [{ kind: "help", sections: HELP_SECTIONS }],
        taskAction: null,
      };
    case "clear":
      return {
        clearTerminal: true,
        entryStatus: "resolved",
        events: [],
        taskAction: null,
      };
    case "list":
      return {
        clearTerminal: false,
        entryStatus: "resolved",
        events: buildTaskListEvents(taskState),
        taskAction: null,
      };
    case "add":
      return successResult(
        taskState,
        `Added "${parsed.command.title}"`,
        addTask(parsed.command.title)
      );
    case "done": {
      const task = resolveTaskByTarget(taskState.tasks, parsed.command.target);
      if (!task) {
        return errorResult(`No task found for "${parsed.command.target}"`);
      }

      if (task.status === "completed") {
        return {
          clearTerminal: false,
          entryStatus: "resolved",
          events: [
            {
              kind: "message",
              level: "warning",
              text: `Task "${task.title}" is already completed.`,
            },
          ],
          taskAction: null,
        };
      }

      return successResult(
        taskState,
        `Completed "${task.title}"`,
        completeTask(task.id)
      );
    }
    case "delete": {
      const task = resolveTaskByTarget(taskState.tasks, parsed.command.target);
      if (!task) {
        return errorResult(`No task found for "${parsed.command.target}"`);
      }

      return successResult(
        taskState,
        `Deleted "${task.title}"`,
        deleteTask(task.id)
      );
    }
    case "edit": {
      const task = resolveMutableTask(taskState, parsed.command.target);
      if (!task) {
        return errorResult(`No active task found for "${parsed.command.target}"`);
      }

      return successResult(
        taskState,
        `Renamed #${task.visibleIndex} to "${parsed.command.title}"`,
        editTask(task.id, parsed.command.title)
      );
    }
    case "move": {
      const task = resolveMutableTask(taskState, parsed.command.target);
      if (!task) {
        return errorResult(`No active task found for "${parsed.command.target}"`);
      }

      return successResult(
        taskState,
        `Moved #${task.visibleIndex} to ${parsed.command.bucket}`,
        moveTask(task.id, parsed.command.bucket)
      );
    }
    case "priority": {
      const task = resolveMutableTask(taskState, parsed.command.target);
      if (!task) {
        return errorResult(`No active task found for "${parsed.command.target}"`);
      }

      return successResult(
        taskState,
        parsed.command.priority
          ? `Set priority on #${task.visibleIndex} to ${parsed.command.priority}`
          : `Cleared priority on #${task.visibleIndex}`,
        setTaskPriority(task.id, parsed.command.priority)
      );
    }
    case "due": {
      const task = resolveMutableTask(taskState, parsed.command.target);
      if (!task) {
        return errorResult(`No active task found for "${parsed.command.target}"`);
      }

      return successResult(
        taskState,
        parsed.command.dueDate
          ? `Set due date on #${task.visibleIndex} to ${parsed.command.dueDate}`
          : `Cleared due date on #${task.visibleIndex}`,
        setTaskDueDate(task.id, parsed.command.dueDate)
      );
    }
    default: {
      const exhaustiveCheck: never = parsed.command;
      throw new Error(`Unhandled command: ${exhaustiveCheck}`);
    }
  }
};
