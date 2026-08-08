import { createIndexedDB } from "../indexedDB";

const indexedDB = createIndexedDB({
  dbName: "indexed-db-test",
  storeName: "records",
});

describe("indexed db", () => {
  it("returns undefined for a missing key", async () => {
    await expect(indexedDB.get("missing")).resolves.toBeUndefined();
  });

  it("round-trips values through the kv store", async () => {
    await indexedDB.set("todos", ["a", "b"]);
    await expect(indexedDB.get("todos")).resolves.toEqual(["a", "b"]);

    await indexedDB.set("todos", ["c"]);
    await expect(indexedDB.get("todos")).resolves.toEqual(["c"]);
  });

  it("stores structured values without serialization", async () => {
    await indexedDB.set("github-settings", { owner: "toon", repo: "todos" });
    await expect(indexedDB.get("github-settings")).resolves.toEqual({
      owner: "toon",
      repo: "todos",
    });
  });

  it("removes keys", async () => {
    await indexedDB.set("todos", ["a"]);
    await indexedDB.remove("todos");
    await expect(indexedDB.get("todos")).resolves.toBeUndefined();
  });

  it("reports when indexedDB is unavailable without caching the failure", async () => {
    const originalIndexedDB = globalThis.indexedDB;
    indexedDB.close();
    globalThis.indexedDB = undefined as unknown as IDBFactory;

    try {
      await expect(indexedDB.get("missing")).rejects.toThrow(
        "indexedDB is not available",
      );
    } finally {
      globalThis.indexedDB = originalIndexedDB;
    }

    await expect(indexedDB.get("missing")).resolves.toBeUndefined();
  });
});
