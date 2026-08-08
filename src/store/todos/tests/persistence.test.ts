import { indexedDB } from "../../../services/indexedDB";
import { sanitizeTodos, todosStore } from "../persistence";
import { SAMPLE_TODOS } from "../sampleTodos";

describe("todos persistence store", () => {
  it("falls back to the sample todos when nothing is stored", async () => {
    await todosStore.initialize();
    expect(todosStore.getSnapshot()).toEqual(SAMPLE_TODOS);
  });

  it("round-trips todos through indexedDB", async () => {
    await todosStore.set(["(A) Pay bill", "Call plumber"]);
    expect(todosStore.getSnapshot()).toEqual(["(A) Pay bill", "Call plumber"]);
  });

  it("keeps an explicitly empty list instead of restoring samples", async () => {
    await todosStore.set([]);
    expect(todosStore.getSnapshot()).toEqual([]);
  });

  it("drops non-string entries from stored values", async () => {
    await indexedDB.set("todos", ["keep", 42, null, "also keep"]);
    await todosStore.initialize();
    expect(todosStore.getSnapshot()).toEqual(["keep", "also keep"]);
  });

  it("falls back to samples when the stored value is not an array", async () => {
    await indexedDB.set("todos", "not an array");
    await todosStore.initialize();
    expect(todosStore.getSnapshot()).toEqual(SAMPLE_TODOS);
  });

  it("sanitizes arbitrary values", () => {
    expect(sanitizeTodos(["a", 1, "b"])).toEqual(["a", "b"]);
    expect(sanitizeTodos("nope")).toBeUndefined();
    expect(sanitizeTodos(undefined)).toBeUndefined();
  });

  it("broadcasts stored todos to subscribers in other contexts", async () => {
    const received: (readonly string[])[] = [];
    const unsubscribe = todosStore.subscribe(() =>
      received.push(todosStore.getSnapshot()),
    );

    try {
      await todosStore.set(["broadcast me"]);
      // BroadcastChannel delivery is asynchronous with no completion
      // signal, so poll briefly instead of racing a single timer tick.
      await vi.waitFor(() => expect(received).toEqual([["broadcast me"]]));
    } finally {
      unsubscribe();
    }
  });
});
