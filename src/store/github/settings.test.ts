import { kvGet, kvSet } from "../db";
import {
  GITHUB_STORAGE_KEY,
  hashTodos,
  loadGitHubSettings,
  storeGitHubSettings,
} from "./settings";

describe("github settings", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns empty settings when nothing is stored", async () => {
    await expect(loadGitHubSettings()).resolves.toEqual({});
  });

  it("round-trips settings through IndexedDB", async () => {
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
    await kvSet("github-settings", "a string");
    await expect(loadGitHubSettings()).resolves.toEqual({});

    await kvSet("github-settings", 42);
    await expect(loadGitHubSettings()).resolves.toEqual({});
  });

  it("drops unknown keys and non-string fields from stored settings", async () => {
    await kvSet("github-settings", {
      owner: "toon",
      repo: 42,
      token: null,
      injected: "value",
      lastSyncedAt: ["not", "a", "string"],
    });

    await expect(loadGitHubSettings()).resolves.toEqual({ owner: "toon" });
  });

  it("migrates legacy localStorage settings into IndexedDB once", async () => {
    localStorage.setItem(
      GITHUB_STORAGE_KEY,
      JSON.stringify({ owner: "toon", repo: "todos", injected: "value" }),
    );

    await expect(loadGitHubSettings()).resolves.toEqual({
      owner: "toon",
      repo: "todos",
    });
    expect(localStorage.getItem(GITHUB_STORAGE_KEY)).toBeNull();
    await expect(kvGet("github-settings")).resolves.toEqual({
      owner: "toon",
      repo: "todos",
    });
  });

  it("migrates corrupt legacy settings as empty and removes the key", async () => {
    localStorage.setItem(GITHUB_STORAGE_KEY, "not json");

    await expect(loadGitHubSettings()).resolves.toEqual({});
    expect(localStorage.getItem(GITHUB_STORAGE_KEY)).toBeNull();
  });

  it("hashes todos stably and detects changes", () => {
    const todos = ["(A) Pay bill", "Call plumber"];

    expect(hashTodos(todos)).toBe(hashTodos(["(A) Pay bill", "Call plumber"]));
    expect(hashTodos(todos)).not.toBe(hashTodos(["(A) Pay bill"]));
    expect(hashTodos([])).toMatch(/^[0-9a-f]{8}$/);
  });
});
