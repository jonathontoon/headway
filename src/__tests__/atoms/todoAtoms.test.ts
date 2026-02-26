import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getDefaultStore } from "jotai";
import {
  todosAtom,
  addTodoAtom,
  removeTodoAtom,
  updateTodoAtom,
  completeTodoAtom,
} from "@atoms/todoAtoms";

const DEFAULTS = [
  "(A) Call mom @phone +personal",
  "(B) 2026-02-25 Buy groceries @errands +home",
  "x 2026-02-24 Read chapter 3 +book",
  "Submit quarterly report +work @computer",
  "(C) Fix leaky faucet @home",
];

const store = getDefaultStore();

beforeEach(() => {
  store.set(todosAtom, [...DEFAULTS]);
});

describe("initial state", () => {
  it("contains 5 default todos", () => {
    expect(store.get(todosAtom)).toHaveLength(5);
  });
});

describe("addTodoAtom", () => {
  it("appends to end of list", () => {
    store.set(addTodoAtom, "Buy milk");
    const todos = store.get(todosAtom);
    expect(todos).toHaveLength(6);
    expect(todos[5]).toBe("Buy milk");
  });
});

describe("removeTodoAtom", () => {
  it("removes todo at 1-based index 1", () => {
    store.set(removeTodoAtom, 1);
    const todos = store.get(todosAtom);
    expect(todos).toHaveLength(4);
    expect(todos[0]).toBe(DEFAULTS[1]);
  });

  it("removes todo at 1-based index 3", () => {
    store.set(removeTodoAtom, 3);
    const todos = store.get(todosAtom);
    expect(todos).toHaveLength(4);
    expect(todos[2]).toBe(DEFAULTS[3]);
  });

  it("removes last todo", () => {
    store.set(removeTodoAtom, 5);
    const todos = store.get(todosAtom);
    expect(todos).toHaveLength(4);
    expect(todos[3]).toBe(DEFAULTS[3]);
  });

  it("does not throw for out-of-range index", () => {
    expect(() => store.set(removeTodoAtom, 99)).not.toThrow();
    expect(store.get(todosAtom)).toHaveLength(5);
  });
});

describe("updateTodoAtom", () => {
  it("replaces todo at 1-based index", () => {
    store.set(updateTodoAtom, { index: 2, text: "Updated text" });
    expect(store.get(todosAtom)[1]).toBe("Updated text");
  });

  it("does not throw for out-of-range index", () => {
    expect(() =>
      store.set(updateTodoAtom, { index: 99, text: "text" })
    ).not.toThrow();
    expect(store.get(todosAtom)).toHaveLength(5);
  });
});

describe("completeTodoAtom", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("prefixes with x YYYY-MM-DD", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-26"));
    store.set(completeTodoAtom, 4); // "Submit quarterly report +work @computer"
    expect(store.get(todosAtom)[3]).toBe(
      "x 2026-02-26 Submit quarterly report +work @computer"
    );
  });

  it("strips (A) priority before completing", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-26"));
    store.set(completeTodoAtom, 1); // "(A) Call mom @phone +personal"
    expect(store.get(todosAtom)[0]).toBe(
      "x 2026-02-26 Call mom @phone +personal"
    );
  });

  it("does not double-complete an already-completed todo", () => {
    const original = DEFAULTS[2]; // "x 2026-02-24 Read chapter 3 +book"
    store.set(completeTodoAtom, 3);
    expect(store.get(todosAtom)[2]).toBe(original);
  });
});
