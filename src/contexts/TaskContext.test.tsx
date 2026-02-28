// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import {
  TASK_STORAGE_KEY,
  TaskProvider,
  useTaskActions,
  useVisibleTasks,
} from "@contexts/TaskContext";

const TaskHarness = () => {
  const tasks = useVisibleTasks();
  const { addTask } = useTaskActions();

  return (
    <div>
      <span data-testid="count">{tasks.length}</span>
      <button onClick={() => addTask("New task")} type="button">
        Add
      </button>
    </div>
  );
};

describe("TaskProvider", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("hydrates from structured JSON and persists updates", () => {
    localStorage.setItem(
      TASK_STORAGE_KEY,
      JSON.stringify([
        {
          id: "seeded",
          title: "Seeded task",
          notes: "",
          status: "active",
          bucket: "inbox",
          priority: null,
          dueDate: null,
          project: null,
          context: null,
          createdAt: "2026-02-28T00:00:00.000Z",
          completedAt: null,
        },
      ])
    );

    render(
      <TaskProvider>
        <TaskHarness />
      </TaskProvider>
    );

    expect(screen.getByTestId("count")).toHaveTextContent("1");

    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(screen.getByTestId("count")).toHaveTextContent("2");
    expect(JSON.parse(localStorage.getItem(TASK_STORAGE_KEY) ?? "[]")).toHaveLength(2);
  });
});
