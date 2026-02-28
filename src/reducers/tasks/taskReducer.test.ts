import { describe, expect, it } from "vitest";
import {
  addTask,
  completeTask,
  deleteTask,
  editTask,
  moveTask,
  setTaskDueDate,
  setTaskPriority,
} from "@reducers/tasks/taskActions";
import { createTaskState, taskReducer } from "@reducers/tasks/taskReducer";

describe("taskReducer", () => {
  it("adds a structured task", () => {
    const state = createTaskState();
    const nextState = taskReducer(
      state,
      addTask("Write docs", "2026-02-28T00:00:00.000Z")
    );

    expect(nextState.tasks).toHaveLength(1);
    expect(nextState.tasks[0]).toMatchObject({
      title: "Write docs",
      bucket: "inbox",
      status: "active",
      createdAt: "2026-02-28T00:00:00.000Z",
    });
  });

  it("updates and completes an existing task", () => {
    const state = taskReducer(
      createTaskState(),
      addTask("Old title", "2026-02-28T00:00:00.000Z")
    );
    const taskId = state.tasks[0].id;

    const renamedState = taskReducer(state, editTask(taskId, "New title"));
    const completedState = taskReducer(
      renamedState,
      completeTask(taskId, "2026-03-01T10:00:00.000Z")
    );

    expect(completedState.tasks[0]).toMatchObject({
      title: "New title",
      status: "completed",
      completedAt: "2026-03-01T10:00:00.000Z",
    });
  });

  it("moves, reprioritizes, sets due dates, and deletes tasks", () => {
    const state = taskReducer(
      createTaskState(),
      addTask("Ship release", "2026-02-28T00:00:00.000Z")
    );
    const taskId = state.tasks[0].id;

    const movedState = taskReducer(state, moveTask(taskId, "today"));
    const prioritizedState = taskReducer(movedState, setTaskPriority(taskId, "A"));
    const dueState = taskReducer(
      prioritizedState,
      setTaskDueDate(taskId, "2026-03-05")
    );
    const deletedState = taskReducer(dueState, deleteTask(taskId));

    expect(dueState.tasks[0]).toMatchObject({
      bucket: "today",
      priority: "A",
      dueDate: "2026-03-05",
    });
    expect(deletedState.tasks).toHaveLength(0);
  });
});
