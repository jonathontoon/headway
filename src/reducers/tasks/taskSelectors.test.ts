import { describe, expect, it } from "vitest";
import {
  getVisibleTasks,
  groupVisibleTasks,
  resolveTaskByTarget,
} from "@reducers/tasks/taskSelectors";
import type { Task } from "@reducers/tasks/taskTypes";

const makeTask = (overrides: Partial<Task>): Task => ({
  id: crypto.randomUUID(),
  title: "Task",
  notes: "",
  status: "active",
  bucket: "inbox",
  priority: null,
  dueDate: null,
  project: null,
  context: null,
  createdAt: "2026-02-28T00:00:00.000Z",
  completedAt: null,
  ...overrides,
});

describe("task selectors", () => {
  it("sorts active tasks into contiguous visible indices", () => {
    const tasks = [
      makeTask({ title: "Someday", bucket: "anytime", createdAt: "2026-02-28T03:00:00.000Z" }),
      makeTask({ title: "Today later", bucket: "today", priority: "B" }),
      makeTask({ title: "Inbox first", bucket: "inbox" }),
      makeTask({ title: "Done", status: "completed" }),
      makeTask({ title: "Today first", bucket: "today", priority: "A" }),
    ];

    const visibleTasks = getVisibleTasks(tasks);

    expect(visibleTasks.map((task) => task.title)).toEqual([
      "Inbox first",
      "Today first",
      "Today later",
      "Someday",
    ]);
    expect(visibleTasks.map((task) => task.visibleIndex)).toEqual([1, 2, 3, 4]);
  });

  it("groups visible tasks by bucket and resolves numeric targets", () => {
    const tasks = [
      makeTask({ id: "alpha", title: "Inbox", bucket: "inbox" }),
      makeTask({ id: "beta", title: "Upcoming", bucket: "upcoming" }),
    ];

    const visibleTasks = getVisibleTasks(tasks);
    const groups = groupVisibleTasks(visibleTasks);

    expect(groups.map((group) => group.label)).toEqual(["Inbox", "Upcoming"]);
    expect(resolveTaskByTarget(tasks, 2)?.id).toBe("beta");
    expect(resolveTaskByTarget(tasks, "alpha")?.title).toBe("Inbox");
  });
});
