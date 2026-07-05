import { runTodoCommand } from "./commands";
import type { TodoClock } from "./types";

const clock: TodoClock = {
  today: () => "2026-07-05",
};

const todos = [
  "(A) 2026-07-01 Pay electric bill +bills due:2026-07-04",
  "2026-07-02 Schedule Goodwill pickup +GarageSale @phone due:2026-07-05",
  "2026-07-03 Fix leaky faucet @home",
  "2026-07-03 Submit quarterly report +work @computer",
  "x 2026-07-04 2026-07-01 Send invoices +work @computer pri:B",
];

describe("todo commands", () => {
  it("adds tasks with today's creation date and preserves priority position", () => {
    const result = runTodoCommand(
      "add (B) Renew passport due:2026-07-10",
      {
        todos,
      },
      clock,
    );

    expect(result.nextTodos.at(-1)).toBe(
      "(B) 2026-07-05 Renew passport due:2026-07-10",
    );
    expect(result.output).toBe("Added: 6. (B) Renew passport due:2026-07-10");
  });

  it("edits a task as a direct todo.txt replacement", () => {
    const result = runTodoCommand(
      "edit 4 (C) Submit report +work @urgent",
      {
        todos,
      },
      clock,
    );

    expect(result.nextTodos[3]).toBe(
      "(C) 2026-07-03 Submit report +work @urgent",
    );
    expect(result.output).toBe("Updated: Submit report +work @urgent");
  });

  it("shows invalid ids and task detail", () => {
    expect(runTodoCommand("show 99", { todos }, clock).output).toBe(
      "Error: no task with that id.",
    );

    expect(runTodoCommand("show 1", { todos }, clock).output).toContain(
      "created: 2026-07-01  priority: A  due: 2026-07-04  status: open",
    );
  });

  it("deletes tasks and warns when deleting open work", () => {
    const result = runTodoCommand("delete 3", { todos }, clock);

    expect(result.nextTodos).toHaveLength(4);
    expect(result.output).toBe(
      "Deleted: Fix leaky faucet @home\nWarning: task was not marked complete - deleted anyway.",
    );
  });

  it("completes and reopens tasks while moving priority through pri metadata", () => {
    const completed = runTodoCommand("complete 1", { todos }, clock);

    expect(completed.nextTodos[0]).toBe(
      "x 2026-07-05 2026-07-01 Pay electric bill +bills due:2026-07-04 pri:A",
    );
    expect(completed.output).toBe(
      "Completed: Pay electric bill +bills due:2026-07-04",
    );

    const reopened = runTodoCommand(
      "undo 1",
      { todos: completed.nextTodos },
      clock,
    );

    expect(reopened.nextTodos[0]).toBe(
      "(A) 2026-07-01 Pay electric bill +bills due:2026-07-04",
    );
    expect(reopened.output).toBe(
      "Reopened: Pay electric bill +bills due:2026-07-04",
    );
  });

  it("updates attributes and rejects invalid values", () => {
    expect(runTodoCommand("due 3 July", { todos }, clock).output).toBe(
      'Error: invalid date "July" - expected YYYY-MM-DD.',
    );

    const due = runTodoCommand("due 3 2026-07-10", { todos }, clock);
    expect(due.nextTodos[2]).toBe(
      "2026-07-03 Fix leaky faucet @home due:2026-07-10",
    );

    const priority = runTodoCommand("priority 3 C", { todos }, clock);
    expect(priority.nextTodos[2]).toBe("(C) 2026-07-03 Fix leaky faucet @home");

    const tag = runTodoCommand("tag 1 @urgent", { todos }, clock);
    expect(tag.nextTodos[0]).toContain("@urgent");

    const project = runTodoCommand("project 3 +home", { todos }, clock);
    expect(project.nextTodos[2]).toContain("+home");
  });

  it("clears due dates, priorities, tags, and projects", () => {
    expect(runTodoCommand("clear due 1", { todos }, clock).nextTodos[0]).toBe(
      "(A) 2026-07-01 Pay electric bill +bills",
    );
    expect(
      runTodoCommand("clear priority 1", { todos }, clock).nextTodos[0],
    ).toBe("2026-07-01 Pay electric bill +bills due:2026-07-04");
    expect(runTodoCommand("clear tags 2", { todos }, clock).nextTodos[1]).toBe(
      "2026-07-02 Schedule Goodwill pickup +GarageSale due:2026-07-05",
    );
    expect(
      runTodoCommand("clear project 2", { todos }, clock).nextTodos[1],
    ).toBe("2026-07-02 Schedule Goodwill pickup @phone due:2026-07-05");
  });

  it("renders list views and stats with a fixed date", () => {
    expect(runTodoCommand("today", { todos }, clock).output).toContain(
      "1. (A) Pay electric bill +bills due:2026-07-04",
    );
    expect(runTodoCommand("upcoming", { todos }, clock).output).toBe(
      "Upcoming is empty.",
    );
    expect(runTodoCommand("inbox", { todos }, clock).output).toBe(
      "3. Fix leaky faucet @home",
    );
    expect(runTodoCommand("someday", { todos }, clock).output).toContain(
      "4. Submit quarterly report +work @computer",
    );
    expect(runTodoCommand("archive", { todos }, clock).output).toContain(
      "5. Send invoices +work @computer",
    );
    expect(runTodoCommand("projects", { todos }, clock).output).toContain(
      "3 projects, 3 tasks between them.",
    );
    expect(runTodoCommand("stats", { todos }, clock).output).toContain(
      "4 tasks on your radar right now.",
    );
  });

  it("reports unknown commands", () => {
    expect(runTodoCommand("lst", { todos }, clock).output).toBe(
      "lst is not a recognized command. Type 'help' for all available commands.",
    );
  });
});
