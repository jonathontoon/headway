import { kvDelete, kvGet, kvSet } from "./db";

describe("db", () => {
  it("returns undefined for a missing key", async () => {
    await expect(kvGet("missing")).resolves.toBeUndefined();
  });

  it("round-trips values through the kv store", async () => {
    await kvSet("todos", ["a", "b"]);
    await expect(kvGet("todos")).resolves.toEqual(["a", "b"]);

    await kvSet("todos", ["c"]);
    await expect(kvGet("todos")).resolves.toEqual(["c"]);
  });

  it("stores structured values without serialization", async () => {
    await kvSet("github-settings", { owner: "toon", repo: "todos" });
    await expect(kvGet("github-settings")).resolves.toEqual({
      owner: "toon",
      repo: "todos",
    });
  });

  it("deletes keys", async () => {
    await kvSet("todos", ["a"]);
    await kvDelete("todos");
    await expect(kvGet("todos")).resolves.toBeUndefined();
  });
});
