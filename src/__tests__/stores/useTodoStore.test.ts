import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useTodoStore } from "@stores/useTodoStore";

const DEFAULTS = [
  "(A) Call mom @phone +personal",
  "(B) 2026-02-25 Buy groceries @errands +home",
  "x 2026-02-24 Read chapter 3 +book",
  "Submit quarterly report +work @computer",
  "(C) Fix leaky faucet @home",
];

beforeEach(() => {
  useTodoStore.setState({ todos: [...DEFAULTS] });
});

describe("initial state", () => {
  it("contains 5 default todos", () => {
    expect(useTodoStore.getState().todos).toHaveLength(5);
  });
});

describe("addTodo", () => {
  it("appends to end of list", () => {
    useTodoStore.getState().addTodo("Buy milk");
    const { todos } = useTodoStore.getState();
    expect(todos).toHaveLength(6);
    expect(todos[5]).toBe("Buy milk");
  });
});

describe("removeTodo", () => {
  it("removes todo at 1-based index 1", () => {
    useTodoStore.getState().removeTodo(1);
    const { todos } = useTodoStore.getState();
    expect(todos).toHaveLength(4);
    expect(todos[0]).toBe(DEFAULTS[1]);
  });

  it("removes todo at 1-based index 3", () => {
    useTodoStore.getState().removeTodo(3);
    const { todos } = useTodoStore.getState();
    expect(todos).toHaveLength(4);
    expect(todos[2]).toBe(DEFAULTS[3]);
  });

  it("removes last todo", () => {
    useTodoStore.getState().removeTodo(5);
    const { todos } = useTodoStore.getState();
    expect(todos).toHaveLength(4);
    expect(todos[3]).toBe(DEFAULTS[3]);
  });

  it("does not throw for out-of-range index", () => {
    expect(() => useTodoStore.getState().removeTodo(99)).not.toThrow();
    expect(useTodoStore.getState().todos).toHaveLength(5);
  });
});

describe("updateTodo", () => {
  it("replaces todo at 1-based index", () => {
    useTodoStore.getState().updateTodo(2, "Updated text");
    expect(useTodoStore.getState().todos[1]).toBe("Updated text");
  });

  it("does not throw for out-of-range index", () => {
    expect(() => useTodoStore.getState().updateTodo(99, "text")).not.toThrow();
    expect(useTodoStore.getState().todos).toHaveLength(5);
  });
});

describe("completeTodo", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("prefixes with x YYYY-MM-DD", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-26"));
    useTodoStore.getState().completeTodo(4); // "Submit quarterly report +work @computer"
    expect(useTodoStore.getState().todos[3]).toBe(
      "x 2026-02-26 Submit quarterly report +work @computer"
    );
  });

  it("strips (A) priority before completing", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-26"));
    useTodoStore.getState().completeTodo(1); // "(A) Call mom @phone +personal"
    expect(useTodoStore.getState().todos[0]).toBe(
      "x 2026-02-26 Call mom @phone +personal"
    );
  });

  it("does not double-complete an already-completed todo", () => {
    const original = DEFAULTS[2]; // "x 2026-02-24 Read chapter 3 +book"
    useTodoStore.getState().completeTodo(3);
    expect(useTodoStore.getState().todos[2]).toBe(original);
  });
});
