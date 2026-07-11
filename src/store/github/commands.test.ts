import { encodeLines, type FetchFn } from "./api";
import {
  isGitHubCommand,
  runGitHubCommand,
  type GitHubCommandDeps,
} from "./commands";
import { hashTodos, loadGitHubSettings, storeGitHubSettings } from "./settings";

const todos = ["(A) Pay electric bill +bills", "Call plumber @phone"];

type Route = (init?: RequestInit) => Response;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

function fakeFetch(routes: Record<string, Route>): FetchFn {
  return (input, init) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    const method = init?.method ?? "GET";
    const key = Object.keys(routes).find((route) => {
      const [routeMethod, routeUrl] = route.split(" ");
      return method === routeMethod && url.startsWith(routeUrl);
    });

    if (!key) {
      throw new Error(`unexpected fetch: ${method} ${url}`);
    }

    return Promise.resolve(routes[key](init));
  };
}

function makeDeps(overrides: Partial<GitHubCommandDeps> = {}) {
  const output: string[] = [];
  const applied: (readonly string[])[] = [];
  const deps: GitHubCommandDeps = {
    getTodos: () => todos,
    emit: (line) => output.push(line),
    applyTodos: (next) => applied.push(next),
    clientId: "client123",
    waitFn: () => Promise.resolve(),
    ...overrides,
  };
  return { deps, output, applied };
}

function configureTarget(extra: Record<string, unknown> = {}) {
  storeGitHubSettings({
    owner: "toon",
    repo: "todos",
    branch: "main",
    path: "todo.txt",
    token: "gho_token",
    login: "toon",
    ...extra,
  });
}

describe("github commands", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("recognizes only github command verbs", () => {
    expect(isGitHubCommand("sync push")).toBe(true);
    expect(isGitHubCommand("  login  ")).toBe(true);
    expect(isGitHubCommand("logout")).toBe(true);
    expect(isGitHubCommand("list")).toBe(false);
    expect(isGitHubCommand("")).toBe(false);
    expect(isGitHubCommand("synchronize")).toBe(false);
  });

  it("rejects unknown sync subcommands", async () => {
    const { deps, output } = makeDeps();
    await runGitHubCommand("sync bogus", deps);

    expect(output[0]).toContain("sync bogus is not a recognized command");
  });

  it("requires an owner/repo argument for setup", async () => {
    const { deps, output } = makeDeps();
    await runGitHubCommand("sync setup nonsense", deps);

    expect(output[0]).toBe(
      "Error: usage: sync setup <owner>/<repo> [branch] [path].",
    );
  });

  it("stores the sync target with defaults and resets bookkeeping", async () => {
    storeGitHubSettings({ token: "gho_token", lastSyncedSha: "stale" });
    const { deps, output } = makeDeps();
    await runGitHubCommand("sync setup toon/todos", deps);

    expect(loadGitHubSettings()).toEqual({
      token: "gho_token",
      owner: "toon",
      repo: "todos",
      branch: "main",
      path: "todo.txt",
    });
    expect(output[0]).toBe(
      "Updated: sync target set to toon/todos:todo.txt (main)",
    );
  });

  it("accepts custom branch and path in setup", async () => {
    const { deps, output } = makeDeps();
    await runGitHubCommand(
      "sync setup toon/todos develop lists/todo.txt",
      deps,
    );

    expect(output[0]).toBe(
      "Updated: sync target set to toon/todos:lists/todo.txt (develop)",
    );
  });

  it("reports status before and after configuration", async () => {
    const empty = makeDeps();
    await runGitHubCommand("sync", empty.deps);
    expect(empty.output[0]).toBe(
      [
        "target: not set - run 'sync setup <owner>/<repo>'",
        "account: not logged in - run 'login'",
        "state: never synced",
      ].join("\n"),
    );

    configureTarget({
      lastSyncedSha: "abc1234def",
      lastSyncedHash: hashTodos(todos),
    });
    const configured = makeDeps();
    await runGitHubCommand("sync status", configured.deps);
    expect(configured.output[0]).toBe(
      [
        "target: toon/todos:todo.txt (main)",
        "account: toon",
        "state: clean, synced at abc1234",
      ].join("\n"),
    );

    configureTarget({ lastSyncedSha: "abc1234def", lastSyncedHash: "stale" });
    const dirty = makeDeps();
    await runGitHubCommand("sync status", dirty.deps);
    expect(dirty.output[0]).toContain("state: local changes not pushed");
  });

  it("requires a client id for login", async () => {
    const { deps, output } = makeDeps({ clientId: undefined });
    await runGitHubCommand("login", deps);

    expect(output[0]).toContain("no GitHub client id is configured");
  });

  it("logs in via the device flow and stores the token", async () => {
    const fetchFn = fakeFetch({
      "POST /api/github/device/code": () =>
        jsonResponse({
          device_code: "dev1",
          user_code: "ABCD-1234",
          verification_uri: "https://github.com/login/device",
          interval: 5,
          expires_in: 900,
        }),
      "POST /api/github/device/token": () =>
        jsonResponse({ access_token: "gho_token" }),
      "GET https://api.github.com/user": () => jsonResponse({ login: "toon" }),
    });
    const { deps, output } = makeDeps({ fetchFn });
    await runGitHubCommand("login", deps);

    expect(output[0]).toBe(
      "Visit https://github.com/login/device and enter code ABCD-1234\nWaiting for authorization...",
    );
    expect(output[1]).toBe("Logged in as toon.");
    expect(loadGitHubSettings()).toMatchObject({
      token: "gho_token",
      login: "toon",
    });
  });

  it("logs out only when a session exists", async () => {
    const anonymous = makeDeps();
    await runGitHubCommand("logout", anonymous.deps);
    expect(anonymous.output[0]).toBe("No GitHub session to log out of.");

    configureTarget();
    const { deps, output } = makeDeps();
    await runGitHubCommand("logout", deps);
    expect(output[0]).toBe("Logged out of GitHub.");
    expect(loadGitHubSettings().token).toBeUndefined();
    expect(loadGitHubSettings().owner).toBe("toon");
  });

  it("requires login and a target before push or pull", async () => {
    const anonymous = makeDeps();
    await runGitHubCommand("sync push", anonymous.deps);
    expect(anonymous.output[0]).toBe(
      "Error: not logged in - run 'login' first.",
    );

    storeGitHubSettings({ token: "gho_token" });
    const untargeted = makeDeps();
    await runGitHubCommand("sync pull", untargeted.deps);
    expect(untargeted.output[0]).toBe(
      "Error: no sync target - run 'sync setup <owner>/<repo>' first.",
    );
  });

  it("pushes a new file when none exists remotely", async () => {
    configureTarget();
    const fetchFn = fakeFetch({
      "GET https://api.github.com/repos/toon/todos/contents/todo.txt": () =>
        jsonResponse({}, 404),
      "PUT https://api.github.com/repos/toon/todos/contents/todo.txt": (
        init,
      ) => {
        const body = JSON.parse(init?.body as string);
        expect(body.sha).toBeUndefined();
        return jsonResponse({ content: { sha: "new-sha-1234" } }, 201);
      },
    });
    const { deps, output } = makeDeps({ fetchFn });
    await runGitHubCommand("sync push", deps);

    expect(output[0]).toBe("Pushed: 2 tasks to toon/todos:todo.txt (new-sha)");
    expect(loadGitHubSettings()).toMatchObject({
      lastSyncedSha: "new-sha-1234",
      lastSyncedHash: hashTodos(todos),
    });
  });

  it("updates an existing file when the remote sha matches the last sync", async () => {
    configureTarget({ lastSyncedSha: "remote-sha" });
    const fetchFn = fakeFetch({
      "GET https://api.github.com/repos/toon/todos/contents/todo.txt": () =>
        jsonResponse({ sha: "remote-sha", content: encodeLines(["old"]) }),
      "PUT https://api.github.com/repos/toon/todos/contents/todo.txt": (
        init,
      ) => {
        const body = JSON.parse(init?.body as string);
        expect(body.sha).toBe("remote-sha");
        return jsonResponse({ content: { sha: "next-sha" } });
      },
    });
    const { deps, output } = makeDeps({ fetchFn });
    await runGitHubCommand("sync push", deps);

    expect(output[0]).toContain("Pushed: 2 tasks");
  });

  it("refuses to push over unseen remote changes unless forced", async () => {
    configureTarget({ lastSyncedSha: "old-sha" });
    const fetchFn = fakeFetch({
      "GET https://api.github.com/repos/toon/todos/contents/todo.txt": () =>
        jsonResponse({ sha: "changed-sha", content: encodeLines(["other"]) }),
      "PUT https://api.github.com/repos/toon/todos/contents/todo.txt": () =>
        jsonResponse({ content: { sha: "forced-sha" } }),
    });

    const blocked = makeDeps({ fetchFn });
    await runGitHubCommand("sync push", blocked.deps);
    expect(blocked.output[0]).toBe(
      "Error: the remote file changed since the last sync - run 'sync pull' first or 'sync push --force'.",
    );

    const forced = makeDeps({ fetchFn });
    await runGitHubCommand("sync push --force", forced.deps);
    expect(forced.output[0]).toContain("Pushed: 2 tasks");
  });

  it("refuses to pull over local changes unless forced", async () => {
    configureTarget();
    const fetchFn = fakeFetch({
      "GET https://api.github.com/repos/toon/todos/contents/todo.txt": () =>
        jsonResponse({
          sha: "remote-sha",
          content: encodeLines(["remote task"]),
        }),
    });

    const blocked = makeDeps({ fetchFn });
    await runGitHubCommand("sync pull", blocked.deps);
    expect(blocked.output[0]).toBe(
      "Error: local changes have not been pushed - run 'sync push' or 'sync pull --force'.",
    );
    expect(blocked.applied).toEqual([]);

    const forced = makeDeps({ fetchFn });
    await runGitHubCommand("sync pull --force", forced.deps);
    expect(forced.applied).toEqual([["remote task"]]);
    expect(forced.output[0]).toBe(
      "Pulled: 1 tasks from toon/todos:todo.txt (remote-)",
    );
    expect(loadGitHubSettings()).toMatchObject({
      lastSyncedSha: "remote-sha",
      lastSyncedHash: hashTodos(["remote task"]),
    });
  });

  it("pulls cleanly when local state matches the last sync", async () => {
    configureTarget({ lastSyncedHash: hashTodos(todos) });
    const fetchFn = fakeFetch({
      "GET https://api.github.com/repos/toon/todos/contents/todo.txt": () =>
        jsonResponse({
          sha: "remote-sha",
          content: encodeLines(["remote task"]),
        }),
    });
    const { deps, applied } = makeDeps({ fetchFn });
    await runGitHubCommand("sync pull", deps);

    expect(applied).toEqual([["remote task"]]);
  });

  it("reports a missing remote file on pull", async () => {
    configureTarget({ lastSyncedHash: hashTodos(todos) });
    const fetchFn = fakeFetch({
      "GET https://api.github.com/repos/toon/todos/contents/todo.txt": () =>
        jsonResponse({}, 404),
    });
    const { deps, output } = makeDeps({ fetchFn });
    await runGitHubCommand("sync pull", deps);

    expect(output[0]).toBe(
      "Error: todo.txt not found in toon/todos - run 'sync push' first.",
    );
  });

  it("maps 401 responses to a re-login hint", async () => {
    configureTarget();
    const fetchFn = fakeFetch({
      "GET https://api.github.com/repos/toon/todos/contents/todo.txt": () =>
        jsonResponse({}, 401),
    });
    const { deps, output } = makeDeps({ fetchFn });
    await runGitHubCommand("sync push", deps);

    expect(output[0]).toBe(
      "Error: GitHub rejected the token - run 'login' again.",
    );
  });
});
