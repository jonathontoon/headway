import { indexedDB } from "../../../services/indexedDB";
import {
  hashTodos,
  loadGitHubSettings,
  storeGitHubSettings,
} from "../settings";

describe("github settings", () => {
  it("returns empty settings when nothing is stored", async () => {
    await expect(loadGitHubSettings()).resolves.toEqual({});
  });

  it("round-trips settings through indexedDB", async () => {
    await storeGitHubSettings({
      owner: "toon",
      repo: "todos",
      branch: "main",
      path: "todo.txt",
      token: "gho_abc",
      login: "toon",
      lastSyncedSha: "abc123",
      lastSyncedHash: "deadbeef",
    });

    await expect(loadGitHubSettings()).resolves.toEqual({
      owner: "toon",
      repo: "todos",
      branch: "main",
      path: "todo.txt",
      token: "gho_abc",
      login: "toon",
      lastSyncedSha: "abc123",
      lastSyncedHash: "deadbeef",
    });
  });

  it("falls back to empty settings on corrupt stored values", async () => {
    await indexedDB.set("github-settings", "a string");
    await expect(loadGitHubSettings()).resolves.toEqual({});

    await indexedDB.set("github-settings", 42);
    await expect(loadGitHubSettings()).resolves.toEqual({});
  });

  it("drops unknown keys and non-string fields from stored settings", async () => {
    await indexedDB.set("github-settings", {
      owner: "toon",
      repo: 42,
      token: null,
      injected: "value",
      lastSyncedAt: ["not", "a", "string"],
    });

    await expect(loadGitHubSettings()).resolves.toEqual({ owner: "toon" });
  });

  it("hashes todos stably and detects changes", () => {
    const todos = ["(A) Pay bill", "Call plumber"];

    expect(hashTodos(todos)).toBe(hashTodos(["(A) Pay bill", "Call plumber"]));
    expect(hashTodos(todos)).not.toBe(hashTodos(["(A) Pay bill"]));
    expect(hashTodos([])).toMatch(/^[0-9a-f]{8}$/);
  });
});
