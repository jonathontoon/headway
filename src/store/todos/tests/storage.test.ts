import { kvSet } from "../../db";
import {
  loadStoredTodos,
  sanitizeTodos,
  storeTodos,
  subscribeTodos,
} from "../storage";
import { SAMPLE_TODOS } from "../sampleTodos";

describe("todos storage", () => {
  it("falls back to the sample todos when nothing is stored", async () => {
    await expect(loadStoredTodos()).resolves.toEqual(SAMPLE_TODOS);
  });

  it("round-trips todos through IndexedDB", async () => {
    await storeTodos(["(A) Pay bill", "Call plumber"]);
    await expect(loadStoredTodos()).resolves.toEqual([
      "(A) Pay bill",
      "Call plumber",
    ]);
  });

  it("keeps an explicitly empty list instead of restoring samples", async () => {
    await storeTodos([]);
    await expect(loadStoredTodos()).resolves.toEqual([]);
  });

  it("drops non-string entries from stored values", async () => {
    await kvSet("todos", ["keep", 42, null, "also keep"]);
    await expect(loadStoredTodos()).resolves.toEqual(["keep", "also keep"]);
  });

  it("falls back to samples when the stored value is not an array", async () => {
    await kvSet("todos", "not an array");
    await expect(loadStoredTodos()).resolves.toEqual(SAMPLE_TODOS);
  });

  it("sanitizes arbitrary values", () => {
    expect(sanitizeTodos(["a", 1, "b"])).toEqual(["a", "b"]);
    expect(sanitizeTodos("nope")).toBeUndefined();
    expect(sanitizeTodos(undefined)).toBeUndefined();
  });

  it("broadcasts stored todos to subscribers in other contexts", async () => {
    const received: (readonly string[])[] = [];
    const unsubscribe = subscribeTodos((todos) => received.push(todos));

    try {
      await storeTodos(["broadcast me"]);
      // BroadcastChannel delivery is asynchronous with no completion
      // signal, so poll briefly instead of racing a single timer tick.
      await vi.waitFor(() => expect(received).toEqual([["broadcast me"]]));
    } finally {
      unsubscribe();
    }
  });
});
