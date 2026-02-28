import { describe, expect, it } from "vitest";
import { addTask } from "@reducers/tasks/taskActions";
import { createTaskState, taskReducer } from "@reducers/tasks/taskReducer";
import { executeCommand } from "@reducers/terminal/terminalCommands";

describe("executeCommand", () => {
  it("creates task updates and success transcript events", () => {
    const state = createTaskState();
    const result = executeCommand("add Ship release", state);

    expect(result.entryStatus).toBe("resolved");
    expect(result.taskAction).not.toBeNull();
    expect(result.events[0]).toMatchObject({
      kind: "message",
      level: "success",
    });

    const nextState = taskReducer(state, result.taskAction!);
    expect(nextState.tasks[0].title).toBe("Ship release");
  });

  it("returns grouped task list events for list and errors for unknown targets", () => {
    const seededState = taskReducer(
      createTaskState(),
      addTask("First task", "2026-02-28T00:00:00.000Z")
    );

    const listResult = executeCommand("list", seededState);
    const doneResult = executeCommand("done 9", seededState);

    expect(listResult.events[0]).toMatchObject({
      kind: "taskList",
      mode: "grouped",
    });
    expect(doneResult.entryStatus).toBe("rejected");
    expect(doneResult.events[0]).toMatchObject({
      kind: "message",
      level: "error",
    });
  });

  it("clears terminal state without producing transcript content", () => {
    const result = executeCommand("clear", createTaskState());

    expect(result.clearTerminal).toBe(true);
    expect(result.taskAction).toBeNull();
    expect(result.events).toHaveLength(0);
  });
});
