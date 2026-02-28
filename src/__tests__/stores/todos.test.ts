import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  $todos,
  addTodo,
  removeTodo,
  updateTodo,
  completeTodo,
  moveToInbox,
  setPriority,
  classifyTodo,
  addTag,
  removeTag,
} from "@stores/todos";

const DEFAULTS = [
  "(A) Call mom @phone +personal",
  "(B) 2026-02-25 Buy groceries @errands +home",
  "x 2026-02-24 Read chapter 3 +book",
  "Submit quarterly report +work @computer",
  "(C) Fix leaky faucet @home",
];

beforeEach(() => {
  $todos.set([...DEFAULTS]);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("initial state", () => {
  it("contains 5 default todos", () => {
    expect($todos.get()).toHaveLength(5);
  });
});

describe("addTodo", () => {
  it("prepends today's date when a creation date is missing", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-26"));

    addTodo("Buy milk");

    const todos = $todos.get();
    expect(todos).toHaveLength(6);
    expect(todos[5]).toBe("2026-02-26 Buy milk");
  });

  it("inserts today's date after a priority marker", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-26"));

    addTodo("(A) Buy milk");

    expect($todos.get()[5]).toBe("(A) 2026-02-26 Buy milk");
  });

  it("preserves an existing creation date", () => {
    addTodo("2026-02-01 Buy milk");

    expect($todos.get()[5]).toBe("2026-02-01 Buy milk");
  });

  it("adds a creation date to completed tasks when only a completion date exists", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-26"));

    addTodo("x 2026-02-25 Ship release");

    expect($todos.get()[5]).toBe("x 2026-02-25 2026-02-26 Ship release");
  });
});

describe("removeTodo", () => {
  it("removes todo at 1-based index 1", () => {
    removeTodo(1);
    const todos = $todos.get();
    expect(todos).toHaveLength(4);
    expect(todos[0]).toBe(DEFAULTS[1]);
  });

  it("removes todo at 1-based index 3", () => {
    removeTodo(3);
    const todos = $todos.get();
    expect(todos).toHaveLength(4);
    expect(todos[2]).toBe(DEFAULTS[3]);
  });

  it("removes last todo", () => {
    removeTodo(5);
    const todos = $todos.get();
    expect(todos).toHaveLength(4);
    expect(todos[3]).toBe(DEFAULTS[3]);
  });

  it("does not throw for out-of-range index", () => {
    expect(() => removeTodo(99)).not.toThrow();
    expect($todos.get()).toHaveLength(5);
  });
});

describe("updateTodo", () => {
  it("replaces todo at 1-based index", () => {
    updateTodo({ index: 2, text: "Updated text" });
    expect($todos.get()[1]).toBe("Updated text");
  });

  it("does not throw for out-of-range index", () => {
    expect(() => updateTodo({ index: 99, text: "text" })).not.toThrow();
    expect($todos.get()).toHaveLength(5);
  });
});

describe("completeTodo", () => {
  it("prefixes with x YYYY-MM-DD", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-26"));
    completeTodo(4); // "Submit quarterly report +work @computer"
    expect($todos.get()[3]).toBe(
      "x 2026-02-26 Submit quarterly report +work @computer"
    );
  });

  it("strips (A) priority before completing", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-26"));
    completeTodo(1); // "(A) Call mom @phone +personal"
    expect($todos.get()[0]).toBe("x 2026-02-26 Call mom @phone +personal");
  });

  it("does not double-complete an already-completed todo", () => {
    const original = DEFAULTS[2]; // "x 2026-02-24 Read chapter 3 +book"
    completeTodo(3);
    expect($todos.get()[2]).toBe(original);
  });
});

describe("setPriority", () => {
  it("sets priority on an active todo without existing priority", () => {
    // "Submit quarterly report +work @computer" (index 4)
    setPriority(4, "A");
    expect($todos.get()[3]).toBe("(A) Submit quarterly report +work @computer");
  });

  it("replaces existing priority", () => {
    // "(A) Call mom @phone +personal" (index 1)
    setPriority(1, "B");
    expect($todos.get()[0]).toBe("(B) Call mom @phone +personal");
  });

  it("removes priority when null is passed", () => {
    // "(A) Call mom @phone +personal" -> "Call mom @phone +personal"
    setPriority(1, null);
    expect($todos.get()[0]).toBe("Call mom @phone +personal");
  });

  it("does not change a todo without priority when null is passed", () => {
    const original = DEFAULTS[3]; // "Submit quarterly report +work @computer"
    setPriority(4, null);
    expect($todos.get()[3]).toBe(original);
  });

  it("does not affect other todos", () => {
    setPriority(1, "C");
    expect($todos.get()[3]).toBe(DEFAULTS[3]);
    expect($todos.get()[4]).toBe(DEFAULTS[4]);
  });
});

describe("moveToInbox", () => {
  it("removes due date and all processed markers", () => {
    $todos.set(["Buy milk due:2026-03-01 @errands +home"]);
    moveToInbox(1);
    expect($todos.get()[0]).not.toContain("due:");
    expect($todos.get()[0]).not.toContain("@errands");
    expect($todos.get()[0]).not.toContain("+home");
    expect($todos.get()[0]).toBe("Buy milk");
  });

  it("removes key:value metadata", () => {
    $todos.set(["Fix bug type:errand project:webapp"]);
    moveToInbox(1);
    expect($todos.get()[0]).toBe("Fix bug");
  });

  it("preserves priority and creation date", () => {
    $todos.set(["(A) 2026-02-26 Call mom @phone"]);
    moveToInbox(1);
    expect($todos.get()[0]).toBe("(A) 2026-02-26 Call mom");
  });

  it("does not affect other todos", () => {
    $todos.set(["First todo", "Second todo due:2026-03-01 @errands"]);
    moveToInbox(2);
    expect($todos.get()[0]).toBe("First todo");
    expect($todos.get()[1]).not.toContain("due:");
    expect($todos.get()[1]).not.toContain("@errands");
  });
});

describe("addTag", () => {
  it("appends a context tag to a todo", () => {
    $todos.set(["Buy milk"]);
    addTag(1, "@errands");
    expect($todos.get()[0]).toBe("Buy milk @errands");
  });

  it("appends a project tag to a todo", () => {
    $todos.set(["Buy milk"]);
    addTag(1, "+home");
    expect($todos.get()[0]).toBe("Buy milk +home");
  });

  it("is idempotent when tag already present", () => {
    $todos.set(["Buy milk @errands"]);
    addTag(1, "@errands");
    expect($todos.get()[0]).toBe("Buy milk @errands");
  });

  it("does not affect other todos", () => {
    $todos.set(["First todo", "Buy milk"]);
    addTag(2, "@errands");
    expect($todos.get()[0]).toBe("First todo");
    expect($todos.get()[1]).toBe("Buy milk @errands");
  });
});

describe("removeTag", () => {
  it("removes a context tag from a todo", () => {
    $todos.set(["Buy milk @errands +home"]);
    removeTag(1, "@errands");
    expect($todos.get()[0]).toBe("Buy milk +home");
  });

  it("removes a project tag from a todo", () => {
    $todos.set(["Buy milk @errands +home"]);
    removeTag(1, "+home");
    expect($todos.get()[0]).toBe("Buy milk @errands");
  });

  it("is a no-op when tag is not present", () => {
    $todos.set(["Buy milk"]);
    removeTag(1, "@errands");
    expect($todos.get()[0]).toBe("Buy milk");
  });

  it("does not affect other todos", () => {
    $todos.set(["First todo @errands", "Buy milk @errands"]);
    removeTag(2, "@errands");
    expect($todos.get()[0]).toBe("First todo @errands");
    expect($todos.get()[1]).toBe("Buy milk");
  });
});

describe("classifyTodo", () => {
  const today = "2026-02-28";
  it("raw todo → inbox", () => expect(classifyTodo("Buy milk", today)).toBe("inbox"));
  it("priority-only todo → inbox", () => expect(classifyTodo("(A) Buy milk", today)).toBe("inbox"));
  it("@context → anytime", () => expect(classifyTodo("Buy milk @errands", today)).toBe("anytime"));
  it("+project → anytime", () => expect(classifyTodo("Buy milk +home", today)).toBe("anytime"));
  it("key:value → anytime", () => expect(classifyTodo("Buy milk type:errand", today)).toBe("anytime"));
  it("due today → today", () => expect(classifyTodo("Buy milk due:2026-02-28", today)).toBe("today"));
  it("overdue → today", () => expect(classifyTodo("Buy milk due:2026-02-01", today)).toBe("today"));
  it("future due → upcoming", () => expect(classifyTodo("Buy milk due:2026-03-01", today)).toBe("upcoming"));
  it("bucket:inbox (legacy) → inbox", () => expect(classifyTodo("Buy milk bucket:inbox", today)).toBe("inbox"));
});
