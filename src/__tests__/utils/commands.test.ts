import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { processCommand } from "@utils/commands";
import { $todos } from "@stores/todos";
import { ResponseType } from "@types";

const TEST_TODOS = [
  "(A) Call mom @phone +personal",
  "Buy groceries @errands +home",
  "Submit quarterly report +work @computer",
];

beforeEach(() => {
  $todos.set([...TEST_TODOS]);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("unknown command", () => {
  it("returns Error with 'command not found'", () => {
    const result = processCommand("foobar", []);
    expect(result).toMatchObject([
      {
        type: ResponseType.Error,
        text: expect.stringContaining("command not found"),
      },
    ]);
  });
});

describe("list", () => {
  it("returns 1 bucketed response grouping all todos into Anytime", () => {
    const result = processCommand("list", []);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe(ResponseType.BucketedTodo);
    if (result[0].type === ResponseType.BucketedTodo) {
      expect(result[0].sections).toHaveLength(1);
      expect(result[0].sections[0].label).toBe("Anytime");
      expect(result[0].sections[0].items).toHaveLength(3);
    }
  });

  it("returns Text 'No todos.' when store is empty", () => {
    $todos.set([]);
    const result = processCommand("list", []);
    expect(result).toMatchObject([
      { type: ResponseType.Text, text: "No todos." },
    ]);
  });
});

describe("help", () => {
  it("returns Help with non-empty sections array", () => {
    const result = processCommand("help", []);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe(ResponseType.Help);
    if (result[0].type === ResponseType.Help) {
      expect(result[0].sections.length).toBeGreaterThan(0);
    }
  });
});

describe("add", () => {
  it("returns Success + updated list on success", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-26"));

    const result = processCommand("add", ["buy", "milk"]);
    expect(result[0]).toMatchObject({
      type: ResponseType.Success,
      text: "Added: 2026-02-26 buy milk",
    });
    expect(result.slice(1).every((r) => r.type === ResponseType.BucketedTodo)).toBe(
      true
    );
    expect($todos.get()).toHaveLength(4);
    expect($todos.get()[3]).toBe("2026-02-26 buy milk");
  });

  it("returns Error when no args", () => {
    const result = processCommand("add", []);
    expect(result).toMatchObject([{ type: ResponseType.Error }]);
  });
});

describe("done", () => {
  it("marks first todo complete and returns success + list", () => {
    const result = processCommand("done", ["1"]);
    expect(result[0].type).toBe(ResponseType.Success);
    expect(result.slice(1).every((r) => r.type === ResponseType.BucketedTodo)).toBe(
      true
    );
    expect($todos.get()[0]).toMatch(/^x /);
  });

  it("returns Error when no args", () => {
    const result = processCommand("done", []);
    expect(result).toMatchObject([{ type: ResponseType.Error }]);
  });

  it("returns Error for index 0", () => {
    const result = processCommand("done", ["0"]);
    expect(result).toMatchObject([
      { type: ResponseType.Error, text: expect.stringContaining("No todo #0") },
    ]);
  });

  it("returns Error for out-of-range index 99", () => {
    const result = processCommand("done", ["99"]);
    expect(result).toMatchObject([
      {
        type: ResponseType.Error,
        text: expect.stringContaining("No todo #99"),
      },
    ]);
  });

  it("returns Warning when todo is already complete", () => {
    $todos.set(["x 2026-02-24 Already done"]);
    const result = processCommand("done", ["1"]);
    expect(result).toMatchObject([{ type: ResponseType.Warning }]);
  });
});

describe("delete", () => {
  it("removes todo and returns success + updated list", () => {
    const result = processCommand("delete", ["1"]);
    expect(result[0].type).toBe(ResponseType.Success);
    expect(result.slice(1).every((r) => r.type === ResponseType.BucketedTodo)).toBe(
      true
    );
    expect($todos.get()).toHaveLength(2);
  });

  it("returns Error when no args", () => {
    const result = processCommand("delete", []);
    expect(result).toMatchObject([{ type: ResponseType.Error }]);
  });
});

describe("rm alias", () => {
  it("behaves the same as delete", () => {
    const result = processCommand("rm", ["1"]);
    expect(result[0].type).toBe(ResponseType.Success);
    expect($todos.get()).toHaveLength(2);
  });
});

describe("update", () => {
  it("updates todo text and returns success + list", () => {
    const result = processCommand("update", ["1", "new", "text"]);
    expect(result[0].type).toBe(ResponseType.Success);
    expect($todos.get()[0]).toBe("new text");
  });

  it("returns Error when no args", () => {
    const result = processCommand("update", []);
    expect(result).toMatchObject([{ type: ResponseType.Error }]);
  });

  it("returns Error when text is missing", () => {
    const result = processCommand("update", ["1"]);
    expect(result).toMatchObject([{ type: ResponseType.Error }]);
  });
});

describe("list with @context filter", () => {
  it("returns only todos containing the @context token grouped by bucket", () => {
    // TEST_TODOS[0] = "(A) Call mom @phone +personal" — matches @phone
    const result = processCommand("list", ["@phone"]);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe(ResponseType.BucketedTodo);
    if (result[0].type === ResponseType.BucketedTodo) {
      const allItems = result[0].sections.flatMap((s) => s.items);
      expect(allItems).toHaveLength(1);
      expect(allItems[0].index).toBe(1);
    }
  });

  it("returns Text when no todos match the @context", () => {
    const result = processCommand("list", ["@nonexistent"]);
    expect(result).toMatchObject([{ type: ResponseType.Text }]);
  });
});

describe("list with +project filter", () => {
  it("returns only todos containing the +project token grouped by bucket", () => {
    // TEST_TODOS[1] = "Buy groceries @errands +home" — matches +home
    const result = processCommand("list", ["+home"]);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe(ResponseType.BucketedTodo);
    if (result[0].type === ResponseType.BucketedTodo) {
      const allItems = result[0].sections.flatMap((s) => s.items);
      expect(allItems).toHaveLength(1);
      expect(allItems[0].index).toBe(2);
    }
  });
});

describe("update add tag", () => {
  it("adds a @context tag", () => {
    const result = processCommand("update", ["1", "add", "@errands"]);
    expect(result[0]).toMatchObject({ type: ResponseType.Success, text: "Added @errands to #1" });
    expect($todos.get()[0]).toContain("@errands");
  });

  it("adds a +project tag", () => {
    const result = processCommand("update", ["1", "add", "+home"]);
    expect(result[0]).toMatchObject({ type: ResponseType.Success, text: "Added +home to #1" });
    expect($todos.get()[0]).toContain("+home");
  });

  it("is idempotent when tag already present", () => {
    $todos.set(["Buy milk @errands"]);
    const result = processCommand("update", ["1", "add", "@errands"]);
    expect(result[0]).toMatchObject({ type: ResponseType.Success });
    expect($todos.get()[0]).toBe("Buy milk @errands");
  });

  it("returns Error when tag is missing", () => {
    const result = processCommand("update", ["1", "add"]);
    expect(result).toMatchObject([{ type: ResponseType.Error }]);
  });

  it("returns Error for bare word (no @ or +)", () => {
    const result = processCommand("update", ["1", "add", "errands"]);
    expect(result).toMatchObject([{ type: ResponseType.Error }]);
  });

  it("returns Error for completed todo", () => {
    $todos.set(["x 2026-02-24 Already done"]);
    const result = processCommand("update", ["1", "add", "@errands"]);
    expect(result).toMatchObject([{ type: ResponseType.Error, text: expect.stringContaining("complete") }]);
  });
});

describe("update remove tag", () => {
  it("removes a @context tag", () => {
    $todos.set(["Buy milk @errands +home"]);
    const result = processCommand("update", ["1", "remove", "@errands"]);
    expect(result[0]).toMatchObject({ type: ResponseType.Success, text: "Removed @errands from #1" });
    expect($todos.get()[0]).not.toContain("@errands");
    expect($todos.get()[0]).toContain("+home");
  });

  it("removes a +project tag", () => {
    $todos.set(["Buy milk @errands +home"]);
    const result = processCommand("update", ["1", "remove", "+home"]);
    expect(result[0]).toMatchObject({ type: ResponseType.Success, text: "Removed +home from #1" });
    expect($todos.get()[0]).not.toContain("+home");
  });

  it("is a no-op when tag not present", () => {
    const result = processCommand("update", ["1", "remove", "@nonexistent"]);
    expect(result[0]).toMatchObject({ type: ResponseType.Success });
    expect($todos.get()[0]).not.toContain("@nonexistent");
  });

  it("returns Error when tag is missing", () => {
    const result = processCommand("update", ["1", "remove"]);
    expect(result).toMatchObject([{ type: ResponseType.Error }]);
  });

  it("returns Error for completed todo", () => {
    $todos.set(["x 2026-02-24 Already done @phone"]);
    const result = processCommand("update", ["1", "remove", "@phone"]);
    expect(result).toMatchObject([{ type: ResponseType.Error, text: expect.stringContaining("complete") }]);
  });
});

describe("update with due field", () => {
  it("sets a due date", () => {
    const result = processCommand("update", ["1", "due", "2026-03-15"]);
    expect(result[0]).toMatchObject({ type: ResponseType.Success });
    expect($todos.get()[0]).toContain("due:2026-03-15");
  });

  it("removes due date when no date provided", () => {
    $todos.set(["Call mom due:2026-03-01 @phone"]);
    const result = processCommand("update", ["1", "due"]);
    expect(result[0]).toMatchObject({ type: ResponseType.Success });
    expect($todos.get()[0]).not.toContain("due:");
  });

  it("returns Error for invalid date format", () => {
    const result = processCommand("update", ["1", "due", "not-a-date"]);
    expect(result).toMatchObject([{ type: ResponseType.Error }]);
  });

  it("returns Error for completed todo", () => {
    $todos.set(["x 2026-02-24 Already done"]);
    const result = processCommand("update", ["1", "due", "2026-03-01"]);
    expect(result).toMatchObject([
      { type: ResponseType.Error, text: expect.stringContaining("complete") },
    ]);
  });
});

describe("update with priority field", () => {
  it("sets a priority", () => {
    const result = processCommand("update", ["1", "priority", "B"]);
    expect(result[0]).toMatchObject({ type: ResponseType.Success });
    expect($todos.get()[0]).toMatch(/^\(B\)/);
  });

  it("removes priority when no value provided", () => {
    const result = processCommand("update", ["1", "priority"]);
    expect(result[0]).toMatchObject({ type: ResponseType.Success });
    expect($todos.get()[0]).not.toMatch(/^\([A-Z]\)/);
  });

  it("returns Error for invalid priority (multi-char)", () => {
    const result = processCommand("update", ["1", "priority", "AB"]);
    expect(result).toMatchObject([{ type: ResponseType.Error }]);
  });
});

describe("move", () => {
  it("move N inbox strips all processed markers and due date", () => {
    $todos.set(["Buy milk @errands due:2026-03-01"]);
    const result = processCommand("move", ["1", "inbox"]);
    expect(result[0]).toMatchObject({
      type: ResponseType.Success,
      text: expect.stringContaining("#1"),
    });
    expect($todos.get()[0]).toBe("Buy milk");
    expect($todos.get()[0]).not.toContain("due:");
    expect($todos.get()[0]).not.toContain("@errands");
  });

  it("move N today sets due date to today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-28"));
    const result = processCommand("move", ["1", "today"]);
    expect(result[0]).toMatchObject({ type: ResponseType.Success });
    expect($todos.get()[0]).toContain("due:2026-02-28");
  });

  it("move N anytime removes due date and legacy bucket tag", () => {
    $todos.set(["Buy milk @errands due:2026-03-01"]);
    const result = processCommand("move", ["1", "anytime"]);
    expect(result[0]).toMatchObject({ type: ResponseType.Success });
    expect($todos.get()[0]).not.toContain("due:");
    expect($todos.get()[0]).not.toContain("bucket:");
  });

  it("move N YYYY-MM-DD sets a specific due date", () => {
    const result = processCommand("move", ["1", "2026-04-01"]);
    expect(result[0]).toMatchObject({ type: ResponseType.Success });
    expect($todos.get()[0]).toContain("due:2026-04-01");
  });

  it("returns Error when no args", () => {
    const result = processCommand("move", []);
    expect(result).toMatchObject([{ type: ResponseType.Error }]);
  });

  it("returns Error when destination is missing", () => {
    const result = processCommand("move", ["1"]);
    expect(result).toMatchObject([{ type: ResponseType.Error }]);
  });

  it("returns Error for unknown destination", () => {
    const result = processCommand("move", ["1", "tomorrow"]);
    expect(result).toMatchObject([{ type: ResponseType.Error }]);
  });

  it("returns Error for out-of-range index", () => {
    const result = processCommand("move", ["99", "inbox"]);
    expect(result).toMatchObject([
      { type: ResponseType.Error, text: expect.stringContaining("No todo #99") },
    ]);
  });

  it("returns Error for completed todo", () => {
    $todos.set(["x 2026-02-24 Already done"]);
    const result = processCommand("move", ["1", "inbox"]);
    expect(result).toMatchObject([
      { type: ResponseType.Error, text: expect.stringContaining("complete") },
    ]);
  });
});
