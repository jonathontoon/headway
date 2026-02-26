import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  todosAtom,
  addTodo,
  removeTodo,
  updateTodo,
  completeTodo,
} from "@atoms/todoAtoms";

const DEFAULTS = [
  "(A) Call mom @phone +personal",
  "(B) 2026-02-25 Buy groceries @errands +home",
  "x 2026-02-24 Read chapter 3 +book",
  "Submit quarterly report +work @computer",
  "(C) Fix leaky faucet @home",
];

beforeEach(() => {
  todosAtom.set([...DEFAULTS]);
});

describe("initial state", () => {
  it("contains 5 default todos", () => {
    expect(todosAtom.get()).toHaveLength(5);
  });
});

describe("addTodo", () => {
  it("appends to end of list", () => {
    addTodo("Buy milk");
    const todos = todosAtom.get();
    expect(todos).toHaveLength(6);
    expect(todos[5]).toBe("Buy milk");
  });
});

describe("removeTodo", () => {
  it("removes todo at 1-based index 1", () => {
    removeTodo(1);
    const todos = todosAtom.get();
    expect(todos).toHaveLength(4);
    expect(todos[0]).toBe(DEFAULTS[1]);
  });

  it("removes todo at 1-based index 3", () => {
    removeTodo(3);
    const todos = todosAtom.get();
    expect(todos).toHaveLength(4);
    expect(todos[2]).toBe(DEFAULTS[3]);
  });

  it("removes last todo", () => {
    removeTodo(5);
    const todos = todosAtom.get();
    expect(todos).toHaveLength(4);
    expect(todos[3]).toBe(DEFAULTS[3]);
  });

  it("does not throw for out-of-range index", () => {
    expect(() => removeTodo(99)).not.toThrow();
    expect(todosAtom.get()).toHaveLength(5);
  });
});

describe("updateTodo", () => {
  it("replaces todo at 1-based index", () => {
    updateTodo({ index: 2, text: "Updated text" });
    expect(todosAtom.get()[1]).toBe("Updated text");
  });

  it("does not throw for out-of-range index", () => {
    expect(() =>
      updateTodo({ index: 99, text: "text" })
    ).not.toThrow();
    expect(todosAtom.get()).toHaveLength(5);
  });
});

describe("completeTodo", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("prefixes with x YYYY-MM-DD", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-26"));
    completeTodo(4); // "Submit quarterly report +work @computer"
    expect(todosAtom.get()[3]).toBe(
      "x 2026-02-26 Submit quarterly report +work @computer"
    );
  });

  it("strips (A) priority before completing", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-26"));
    completeTodo(1); // "(A) Call mom @phone +personal"
    expect(todosAtom.get()[0]).toBe(
      "x 2026-02-26 Call mom @phone +personal"
    );
  });

  it("does not double-complete an already-completed todo", () => {
    const original = DEFAULTS[2]; // "x 2026-02-24 Read chapter 3 +book"
    completeTodo(3);
    expect(todosAtom.get()[2]).toBe(original);
  });
});
