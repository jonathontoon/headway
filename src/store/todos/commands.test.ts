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

// Identity mapping: position N -> stable line N, matching the fixture's
// original order, so existing per-command assertions read naturally.
const view = [1, 2, 3, 4, 5];

describe("todo commands", () => {
  it("adds tasks with today's creation date and preserves priority position", () => {
    const result = runTodoCommand(
      "add (B) Renew passport due:2026-07-10",
      { todos, view: [] },
      clock,
    );

    expect(result.nextTodos.at(-1)).toBe(
      "(B) 2026-07-05 Renew passport due:2026-07-10",
    );
    expect(result.output).toBe("Added: (B) Renew passport due:2026-07-10");
  });

  it("edits a task as a direct todo.txt replacement", () => {
    const result = runTodoCommand(
      "edit 4 (C) Submit report +work @urgent",
      { todos, view },
      clock,
    );

    expect(result.nextTodos[3]).toBe(
      "(C) 2026-07-03 Submit report +work @urgent",
    );
    expect(result.output).toBe("Updated: Submit report +work @urgent");
  });

  it("shows invalid ids and task detail", () => {
    expect(runTodoCommand("show 99", { todos, view }, clock).output).toBe(
      "Error: no task with that id.",
    );

    expect(runTodoCommand("show 1", { todos, view }, clock).output).toBe(
      "(A) Pay electric bill +bills due:2026-07-04\ncreated: 2026-07-01",
    );
  });

  it("shows a completed task with an x prefix and no priority tag", () => {
    expect(runTodoCommand("show 5", { todos, view }, clock).output).toBe(
      "x Send invoices +work @computer\ncreated: 2026-07-01",
    );
  });

  it("requires a recent list before resolving an id", () => {
    expect(
      runTodoCommand("edit 1 text", { todos, view: [] }, clock).output,
    ).toBe("Error: no task list is showing - run 'list' first.");
    expect(runTodoCommand("delete 1", { todos, view: [] }, clock).output).toBe(
      "Error: no task list is showing - run 'list' first.",
    );
    expect(
      runTodoCommand("complete 1", { todos, view: [] }, clock).output,
    ).toBe("Error: no task list is showing - run 'list' first.");
  });

  it("deletes tasks and warns when deleting open work", () => {
    const result = runTodoCommand("delete 3", { todos, view }, clock);

    expect(result.nextTodos).toHaveLength(4);
    expect(result.output).toBe(
      "Deleted: Fix leaky faucet @home\nWarning: task was not marked complete - deleted anyway.",
    );
    expect(result.view).toEqual([]);
  });

  it("completes and reopens tasks while moving priority through pri metadata", () => {
    const completed = runTodoCommand("complete 1", { todos, view }, clock);

    expect(completed.nextTodos[0]).toBe(
      "x 2026-07-05 2026-07-01 Pay electric bill +bills due:2026-07-04 pri:A",
    );
    expect(completed.output).toBe(
      "Completed: Pay electric bill +bills due:2026-07-04",
    );
    expect(completed.view).toEqual(view);

    const reopened = runTodoCommand(
      "undo 1",
      { todos: completed.nextTodos, view: completed.view ?? [] },
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
    expect(runTodoCommand("due 3 July", { todos, view }, clock).output).toBe(
      'Error: invalid date "July" - expected YYYY-MM-DD.',
    );

    const due = runTodoCommand("due 3 2026-07-10", { todos, view }, clock);
    expect(due.nextTodos[2]).toBe(
      "2026-07-03 Fix leaky faucet @home due:2026-07-10",
    );

    const priority = runTodoCommand("priority 3 C", { todos, view }, clock);
    expect(priority.nextTodos[2]).toBe("(C) 2026-07-03 Fix leaky faucet @home");

    const tag = runTodoCommand("tag 1 @urgent", { todos, view }, clock);
    expect(tag.nextTodos[0]).toContain("@urgent");

    const project = runTodoCommand("project 3 +home", { todos, view }, clock);
    expect(project.nextTodos[2]).toContain("+home");
  });

  it("clears due dates, priorities, tags, and projects", () => {
    expect(
      runTodoCommand("clear due 1", { todos, view }, clock).nextTodos[0],
    ).toBe("(A) 2026-07-01 Pay electric bill +bills");
    expect(
      runTodoCommand("clear priority 1", { todos, view }, clock).nextTodos[0],
    ).toBe("2026-07-01 Pay electric bill +bills due:2026-07-04");
    expect(
      runTodoCommand("clear tags 2", { todos, view }, clock).nextTodos[1],
    ).toBe("2026-07-02 Schedule Goodwill pickup +GarageSale due:2026-07-05");
    expect(
      runTodoCommand("clear project 2", { todos, view }, clock).nextTodos[1],
    ).toBe("2026-07-02 Schedule Goodwill pickup @phone due:2026-07-05");
  });

  it("renders list views and stats with a fixed date", () => {
    expect(
      runTodoCommand("today", { todos, view: [] }, clock).output,
    ).toContain("1. (A) Pay electric bill +bills due:2026-07-04");
    expect(runTodoCommand("upcoming", { todos, view: [] }, clock).output).toBe(
      "Upcoming is empty.",
    );
    expect(runTodoCommand("inbox", { todos, view: [] }, clock).output).toBe(
      "1. Fix leaky faucet @home",
    );
    expect(
      runTodoCommand("someday", { todos, view: [] }, clock).output,
    ).toContain("1. Submit quarterly report +work @computer");
    expect(
      runTodoCommand("archive", { todos, view: [] }, clock).output,
    ).toContain("1. Send invoices +work @computer");
    expect(
      runTodoCommand("projects", { todos, view: [] }, clock).output,
    ).toContain("3 projects, 3 tasks between them.");
    expect(
      runTodoCommand("stats", { todos, view: [] }, clock).output,
    ).toContain("4 tasks on your radar right now.");
  });

  it("renders named views through list", () => {
    const todosWithUpcoming = [
      ...todos,
      "2026-07-05 Book flights +travel due:2026-07-09",
    ];

    expect(
      runTodoCommand("list today", { todos, view: [] }, clock).output,
    ).toContain("1. (A) Pay electric bill +bills due:2026-07-04");
    expect(
      runTodoCommand(
        "list upcoming",
        { todos: todosWithUpcoming, view: [] },
        clock,
      ).output,
    ).toBe("1. Book flights +travel due:2026-07-09");
    expect(
      runTodoCommand("list inbox", { todos, view: [] }, clock).output,
    ).toBe("1. Fix leaky faucet @home");
    expect(
      runTodoCommand("list someday", { todos, view: [] }, clock).output,
    ).toContain("1. Submit quarterly report +work @computer");
  });

  it("keeps list project, tag, and keyword filters", () => {
    expect(
      runTodoCommand("list +work", { todos, view: [] }, clock).output,
    ).toContain("1. Submit quarterly report +work @computer");
    expect(
      runTodoCommand("list @home", { todos, view: [] }, clock).output,
    ).toBe("1. Fix leaky faucet @home");
    expect(
      runTodoCommand('list "quarterly"', { todos, view: [] }, clock).output,
    ).toBe("1. Submit quarterly report +work @computer");
  });

  it("treats quoted list view names as keyword filters", () => {
    expect(
      runTodoCommand('list "today"', { todos, view: [] }, clock).output,
    ).toBe('No incomplete tasks match "today".');
  });

  it("reports unknown commands", () => {
    expect(runTodoCommand("lst", { todos, view: [] }, clock).output).toBe(
      "lst is not a recognized command. Type 'help' for all available commands.",
    );
  });

  it("resolves ids against the most recently rendered list, not raw storage position", () => {
    const listed = runTodoCommand("list someday", { todos, view: [] }, clock);

    // Only "Submit quarterly report" qualifies for someday, so it prints as
    // position 1 even though it's stable line 4 - proving ids track the
    // rendered list, not raw todo.txt position.
    expect(listed.output).toBe("1. Submit quarterly report +work @computer");

    const edited = runTodoCommand(
      "edit 1 Submit the quarterly report +work @computer",
      { todos, view: listed.view ?? [] },
      clock,
    );

    expect(edited.nextTodos[3]).toBe(
      "2026-07-03 Submit the quarterly report +work @computer",
    );
    expect(edited.nextTodos[0]).toBe(todos[0]);
  });
});
