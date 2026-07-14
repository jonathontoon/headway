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

  it("returns empty settings when nothing is stored", () => {
    expect(loadGitHubSettings()).toEqual({});
  });

  it("round-trips settings through localStorage", () => {
    storeGitHubSettings({
      owner: "toon",
      repo: "todos",
      branch: "main",
      path: "todo.txt",
      token: "gho_abc",
      login: "toon",
      lastSyncedSha: "abc123",
      lastSyncedHash: "deadbeef",
    });

    expect(loadGitHubSettings()).toEqual({
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

  it("falls back to empty settings on corrupt storage", () => {
    localStorage.setItem(GITHUB_STORAGE_KEY, "not json");
    expect(loadGitHubSettings()).toEqual({});

    localStorage.setItem(GITHUB_STORAGE_KEY, '"a string"');
    expect(loadGitHubSettings()).toEqual({});
  });

  it("drops unknown keys and non-string fields from stored settings", () => {
    localStorage.setItem(
      GITHUB_STORAGE_KEY,
      JSON.stringify({
        owner: "toon",
        repo: 42,
        token: null,
        injected: "value",
        lastSyncedAt: ["not", "a", "string"],
      }),
    );

    expect(loadGitHubSettings()).toEqual({ owner: "toon" });
  });

  it("hashes todos stably and detects changes", () => {
    const todos = ["(A) Pay bill", "Call plumber"];

    expect(hashTodos(todos)).toBe(hashTodos(["(A) Pay bill", "Call plumber"]));
    expect(hashTodos(todos)).not.toBe(hashTodos(["(A) Pay bill"]));
    expect(hashTodos([])).toMatch(/^[0-9a-f]{8}$/);
  });
});
