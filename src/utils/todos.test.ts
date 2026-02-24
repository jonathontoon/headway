import { describe, it, expect } from "vitest";
import { addTodo, completeTodo, replaceTodo } from "./todos";
import { MAX_TODO_COUNT, MAX_TODO_LENGTH } from "@constants";

describe("Todo Utilities Security Hardening", () => {
  it("should enforce MAX_TODO_COUNT in addTodo", () => {
    const todos = Array(MAX_TODO_COUNT).fill({
      id: "1",
      raw: "test",
      completed: false,
      text: "test",
      contexts: [],
      projects: [],
    });

    expect(() => addTodo("new task", todos)).toThrow(
      `Maximum limit of ${MAX_TODO_COUNT} tasks reached.`
    );
  });

  it("should handle NaN gracefully in completeTodo", () => {
    const todos = [{ id: "1", raw: "task", completed: false, text: "task", contexts: [], projects: [] }];
    const result = completeTodo(NaN, todos);
    expect(result).toEqual(todos);
    // Ensure no "NaN" property was added to the array
    expect(Object.keys(result)).not.toContain("NaN");
  });

  it("should handle NaN gracefully in replaceTodo", () => {
    const todos = [{ id: "1", raw: "task", completed: false, text: "task", contexts: [], projects: [] }];
    const result = replaceTodo(NaN, "new text", todos);
    expect(result).toEqual(todos);
    expect(Object.keys(result)).not.toContain("NaN");
  });

  it("should handle out of bounds gracefully in completeTodo", () => {
    const todos = [{ id: "1", raw: "task", completed: false, text: "task", contexts: [], projects: [] }];
    expect(completeTodo(0, todos)).toEqual(todos);
    expect(completeTodo(2, todos)).toEqual(todos);
  });
});
