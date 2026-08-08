import { indexedDB } from "../indexedDB";

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
});
