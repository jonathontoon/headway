import { act, renderHook } from "@testing-library/react";
import { useTodos } from "../useTodos";
import { todosStore } from "../../store/todos/persistence";

describe("useTodos", () => {
  it("updates when the persistent store changes", async () => {
    const { result } = renderHook(() => useTodos());

    await act(async () => {
      await todosStore.set(["new task"]);
    });

    expect(result.current).toEqual(["new task"]);
  });
});
