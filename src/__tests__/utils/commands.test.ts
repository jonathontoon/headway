import { describe, it, expect, beforeEach } from "vitest";
import { getDefaultStore } from "jotai";
import { processCommand } from "@utils/commands";
import { todosAtom } from "@atoms/todoAtoms";
import { ResponseType } from "@types";

const TEST_TODOS = [
  "(A) Call mom @phone +personal",
  "Buy groceries @errands +home",
  "Submit quarterly report +work @computer",
];

const store = getDefaultStore();

beforeEach(() => {
  store.set(todosAtom, [...TEST_TODOS]);
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

describe("echo", () => {
  it("returns Text with joined args", () => {
    const result = processCommand("echo", ["hello", "world"]);
    expect(result).toMatchObject([
      { type: ResponseType.Text, text: "hello world" },
    ]);
  });

  it("returns Error when no args", () => {
    const result = processCommand("echo", []);
    expect(result).toMatchObject([{ type: ResponseType.Error }]);
  });
});

describe("date", () => {
  it("returns Text containing a date string", () => {
    const result = processCommand("date", []);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe(ResponseType.Text);
  });
});

describe("list", () => {
  it("returns 3 Todo items matching store state", () => {
    const result = processCommand("list", []);
    expect(result).toHaveLength(3);
    result.forEach((item) => expect(item.type).toBe(ResponseType.Todo));
  });

  it("returns Text 'No todos.' when store is empty", () => {
    store.set(todosAtom, []);
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
    const result = processCommand("add", ["buy", "milk"]);
    expect(result[0].type).toBe(ResponseType.Success);
    expect(result.slice(1).every((r) => r.type === ResponseType.Todo)).toBe(
      true
    );
    expect(store.get(todosAtom)).toHaveLength(4);
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
    expect(result.slice(1).every((r) => r.type === ResponseType.Todo)).toBe(
      true
    );
    expect(store.get(todosAtom)[0]).toMatch(/^x /);
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
    store.set(todosAtom, ["x 2026-02-24 Already done"]);
    const result = processCommand("done", ["1"]);
    expect(result).toMatchObject([{ type: ResponseType.Warning }]);
  });
});

describe("delete", () => {
  it("removes todo and returns success + updated list", () => {
    const result = processCommand("delete", ["1"]);
    expect(result[0].type).toBe(ResponseType.Success);
    expect(result.slice(1).every((r) => r.type === ResponseType.Todo)).toBe(
      true
    );
    expect(store.get(todosAtom)).toHaveLength(2);
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
    expect(store.get(todosAtom)).toHaveLength(2);
  });
});

describe("update", () => {
  it("updates todo text and returns success + list", () => {
    const result = processCommand("update", ["1", "new", "text"]);
    expect(result[0].type).toBe(ResponseType.Success);
    expect(store.get(todosAtom)[0]).toBe("new text");
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
