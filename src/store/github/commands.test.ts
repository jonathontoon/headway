import { encodeLines, type FetchFn, type WaitFn } from "./api";
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
    emit: (line, options) => {
      if (options?.replace && output.length > 0) {
        output[output.length - 1] = line;
      } else {
        output.push(line);
      }
    },
    applyTodos: (next) => applied.push(next),
    clientId: "client123",
    waitFn: () => Promise.resolve(),
    ...overrides,
  };
  return { deps, output, applied };
}

function configureTarget(extra: Record<string, unknown> = {}) {
  return storeGitHubSettings({
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
    expect(isGitHubCommand("sync backup")).toBe(true);
    expect(isGitHubCommand("  connect  ")).toBe(true);
    expect(isGitHubCommand("disconnect")).toBe(true);
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
    await storeGitHubSettings({ token: "gho_token", lastSyncedSha: "stale" });
    const { deps, output } = makeDeps();
    await runGitHubCommand("sync setup toon/todos", deps);

    expect(await loadGitHubSettings()).toEqual({
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

  it("rejects traversal and empty segments in the setup path", async () => {
    for (const path of ["../secrets.txt", "a//b.txt", "./todo.txt", "a/.."]) {
      const { deps, output } = makeDeps();
      await runGitHubCommand(`sync setup toon/todos main ${path}`, deps);

      expect(output[0]).toBe(
        "Error: path must be a relative file path without '.' or '..' segments.",
      );
    }
    expect((await loadGitHubSettings()).path).toBeUndefined();
  });

  it("reports status before and after configuration", async () => {
    const empty = makeDeps();
    await runGitHubCommand("sync", empty.deps);
    expect(empty.output[0]).toBe(
      "Not syncing yet - run 'sync setup <owner>/<repo>' then 'connect' to get started.",
    );

    await configureTarget({
      lastSyncedSha: "abc1234def",
      lastSyncedHash: hashTodos(todos),
      lastSyncedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    });
    const configured = makeDeps();
    await runGitHubCommand("sync status", configured.deps);
    expect(configured.output[0]).toContain(
      "Syncing to toon/todos:todo.txt (main) as toon - everything's saved",
    );
    expect(configured.output[0]).toContain("last backup");

    await configureTarget({
      lastSyncedSha: "abc1234def",
      lastSyncedHash: "stale",
    });
    const dirty = makeDeps();
    await runGitHubCommand("sync status", dirty.deps);
    expect(dirty.output[0]).toContain("you have unsaved changes");
  });

  it("requires a client id to connect", async () => {
    const { deps, output } = makeDeps({ clientId: undefined });
    await runGitHubCommand("connect", deps);

    expect(output[0]).toContain("no GitHub client id is configured");
  });

  it("connects via the device flow and stores the token", async () => {
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
    await runGitHubCommand("connect", deps);

    expect(output[0]).toBe(
      "Visit https://github.com/login/device and enter code ABCD-1234.\n⠋ Waiting for authorization...",
    );
    expect(output[output.length - 1]).toBe(
      "Connected as toon.\nThis token can read and write every repo on your account - 'disconnect' revokes it.",
    );
    expect(await loadGitHubSettings()).toMatchObject({
      token: "gho_token",
      login: "toon",
    });
  });

  it("stops silently without emitting output when connect is aborted mid-flight", async () => {
    const controller = new AbortController();
    const fetchFn: FetchFn = (input) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("device/code")) {
        // Simulate the user submitting a new command right after the
        // device code comes back, before the poll wait begins.
        controller.abort();
        return Promise.resolve(
          jsonResponse({
            device_code: "dev1",
            user_code: "ABCD-1234",
            verification_uri: "https://github.com/login/device",
            interval: 5,
            expires_in: 900,
          }),
        );
      }
      throw new Error(`unexpected fetch after abort: ${url}`);
    };
    const waitFn: WaitFn = (_ms, signal) =>
      signal?.aborted
        ? Promise.reject(new DOMException("Aborted", "AbortError"))
        : Promise.resolve();

    const { deps, output } = makeDeps({
      fetchFn,
      waitFn,
      signal: controller.signal,
    });
    await runGitHubCommand("connect", deps);

    // The initial "Visit ... / Waiting..." render still happens, but no
    // error and no "Connected" message follow, and nothing is persisted.
    expect(output.some((line) => line.startsWith("Error"))).toBe(false);
    expect(output.some((line) => line.startsWith("Connected"))).toBe(false);
    expect((await loadGitHubSettings()).token).toBeUndefined();
  });

  it("disconnects only when a session exists", async () => {
    const anonymous = makeDeps();
    await runGitHubCommand("disconnect", anonymous.deps);
    expect(anonymous.output[0]).toBe("No GitHub connection to disconnect.");

    await configureTarget();
    const fetchFn = fakeFetch({
      "POST /api/github/token/revoke": () =>
        new Response(null, { status: 204 }),
    });
    const { deps, output } = makeDeps({ fetchFn });
    await runGitHubCommand("disconnect", deps);
    expect(output[0]).toBe("Disconnected from GitHub and revoked the token.");
    expect((await loadGitHubSettings()).token).toBeUndefined();
    expect((await loadGitHubSettings()).owner).toBe("toon");
  });

  it("still disconnects locally when the worker cannot revoke the token", async () => {
    await configureTarget();
    const fetchFn = fakeFetch({
      "POST /api/github/token/revoke": () =>
        new Response("Token revocation is not configured", { status: 501 }),
    });
    const { deps, output } = makeDeps({ fetchFn });
    await runGitHubCommand("disconnect", deps);

    expect(output[0]).toBe(
      "Disconnected from GitHub, but the token could not be revoked automatically - review it at https://github.com/settings/applications.",
    );
    expect((await loadGitHubSettings()).token).toBeUndefined();
  });

  it("requires a connection and a target before backup or restore", async () => {
    const anonymous = makeDeps();
    await runGitHubCommand("sync backup", anonymous.deps);
    expect(anonymous.output[0]).toBe(
      "Error: not connected - run 'connect' first.",
    );

    await storeGitHubSettings({ token: "gho_token" });
    const untargeted = makeDeps();
    await runGitHubCommand("sync restore", untargeted.deps);
    expect(untargeted.output[0]).toBe(
      "Error: no sync target - run 'sync setup <owner>/<repo>' first.",
    );
  });

  it("saves a new file when none exists remotely", async () => {
    await configureTarget();
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
    await runGitHubCommand("sync backup", deps);

    expect(output[0]).toBe("Saved: 2 tasks to toon/todos:todo.txt (new-sha)");
    expect(await loadGitHubSettings()).toMatchObject({
      lastSyncedSha: "new-sha-1234",
      lastSyncedHash: hashTodos(todos),
    });
  });

  it("updates an existing file when the remote sha matches the last sync", async () => {
    await configureTarget({ lastSyncedSha: "remote-sha" });
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
    await runGitHubCommand("sync backup", deps);

    expect(output[0]).toContain("Saved: 2 tasks");
  });

  it("warns but still overwrites when backing up over unseen remote changes", async () => {
    await configureTarget({ lastSyncedSha: "old-sha" });
    const fetchFn = fakeFetch({
      "GET https://api.github.com/repos/toon/todos/contents/todo.txt": () =>
        jsonResponse({ sha: "changed-sha", content: encodeLines(["other"]) }),
      "PUT https://api.github.com/repos/toon/todos/contents/todo.txt": () =>
        jsonResponse({ content: { sha: "new-sha" } }),
    });

    const { deps, output } = makeDeps({ fetchFn });
    await runGitHubCommand("sync backup", deps);

    expect(output[0]).toBe(
      "Warning: overwrote a version already saved on GitHub.\nSaved: 2 tasks to toon/todos:todo.txt (new-sha)",
    );
    expect(await loadGitHubSettings()).toMatchObject({
      lastSyncedSha: "new-sha",
    });
  });

  it("refuses to restore over unsaved changes without --force", async () => {
    await configureTarget();
    const fetchFn = fakeFetch({});

    const { deps, output, applied } = makeDeps({ fetchFn });
    await runGitHubCommand("sync restore", deps);

    expect(applied).toEqual([]);
    expect(output[0]).toBe(
      "Error: this would replace local tasks that aren't backed up - run 'sync restore --force' to continue.",
    );
    expect((await loadGitHubSettings()).lastSyncedSha).toBeUndefined();
  });

  it("warns and replaces local tasks when restoring over unsaved changes with --force", async () => {
    await configureTarget();
    const fetchFn = fakeFetch({
      "GET https://api.github.com/repos/toon/todos/contents/todo.txt": () =>
        jsonResponse({
          sha: "remote-sha",
          content: encodeLines(["remote task"]),
        }),
    });

    const { deps, output, applied } = makeDeps({ fetchFn });
    await runGitHubCommand("sync restore --force", deps);

    expect(applied).toEqual([["remote task"]]);
    expect(output[0]).toBe(
      "Warning: replaced local changes that weren't saved.\nLoaded: 1 tasks from toon/todos:todo.txt (remote-)",
    );
    expect(await loadGitHubSettings()).toMatchObject({
      lastSyncedSha: "remote-sha",
      lastSyncedHash: hashTodos(["remote task"]),
    });
  });

  it("restores cleanly when local state matches the last sync", async () => {
    await configureTarget({ lastSyncedHash: hashTodos(todos) });
    const fetchFn = fakeFetch({
      "GET https://api.github.com/repos/toon/todos/contents/todo.txt": () =>
        jsonResponse({
          sha: "remote-sha",
          content: encodeLines(["remote task"]),
        }),
    });
    const { deps, applied } = makeDeps({ fetchFn });
    await runGitHubCommand("sync restore", deps);

    expect(applied).toEqual([["remote task"]]);
  });

  it("reports a missing remote file on restore", async () => {
    await configureTarget({ lastSyncedHash: hashTodos(todos) });
    const fetchFn = fakeFetch({
      "GET https://api.github.com/repos/toon/todos/contents/todo.txt": () =>
        jsonResponse({}, 404),
    });
    const { deps, output } = makeDeps({ fetchFn });
    await runGitHubCommand("sync restore", deps);

    expect(output[0]).toBe(
      "Error: todo.txt not found in toon/todos - run 'sync backup' first.",
    );
  });

  it("maps 401 responses to a reconnect hint", async () => {
    await configureTarget();
    const fetchFn = fakeFetch({
      "GET https://api.github.com/repos/toon/todos/contents/todo.txt": () =>
        jsonResponse({}, 401),
    });
    const { deps, output } = makeDeps({ fetchFn });
    await runGitHubCommand("sync backup", deps);

    expect(output[0]).toBe(
      "Error: GitHub rejected the token - run 'connect' again.",
    );
  });
});
