import { encodeLines, type FetchFn, type WaitFn } from "./api";
import {
  isGitHubCommand,
  runGitHubCommand,
  type GitHubCommandDeps,
} from "./commands";
import { hashTodos, loadGitHubSettings, storeGitHubSettings } from "./settings";
import { outputText } from "../terminal/output";

const todos = ["(A) Pay electric bill +bills", "Call plumber @phone"];

type Route = (init?: RequestInit) => Response;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

function createRestoreConfirmationStore() {
  let restoreConfirmation: string | undefined;
  return {
    get: () => restoreConfirmation,
    set: (key: string | undefined) => {
      restoreConfirmation = key;
    },
  };
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
      const parts = route.split(" ");
      const routeMethod = parts[0]!;
      const routeUrl = parts[1];
      return (
        routeUrl !== undefined &&
        method === routeMethod &&
        url.startsWith(routeUrl)
      );
    });

    if (!key) {
      throw new Error(`unexpected fetch: ${method} ${url}`);
    }

    return Promise.resolve(routes[key]!(init));
  };
}

function makeDeps(overrides: Partial<GitHubCommandDeps> = {}) {
  const output: string[] = [];
  const applied: (readonly string[])[] = [];
  const deps: GitHubCommandDeps = {
    getTodos: () => todos,
    emit: (line, options) => {
      const text = typeof line === "string" ? line : outputText(line)!;
      if (options?.replace && output.length > 0) {
        output[output.length - 1] = text;
      } else {
        output.push(text);
      }
    },
    applyTodos: (next) => applied.push(next),
    clientId: "client123",
    waitFn: () => Promise.resolve(),
    restoreConfirmation: createRestoreConfirmationStore(),
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

const DEVICE_FLOW_ROUTES: Record<string, Route> = {
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
};

describe("github commands", () => {
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
    expect(output[0]).toContain(
      "Try 'sync status', 'sync backup' or 'sync restore'",
    );
  });

  it("requires an owner/repo argument for connect without making requests", async () => {
    const bare = makeDeps({ fetchFn: fakeFetch({}) });
    await runGitHubCommand("connect", bare.deps);
    expect(bare.output[0]).toBe(
      "Error: usage: connect <owner>/<repo> [branch] [path].",
    );

    const malformed = makeDeps({ fetchFn: fakeFetch({}) });
    await runGitHubCommand("connect nonsense", malformed.deps);
    expect(malformed.output[0]).toBe(
      "Error: usage: connect <owner>/<repo> [branch] [path].",
    );
  });

  it("stores the sync target with defaults and resets bookkeeping when already connected", async () => {
    await storeGitHubSettings({
      token: "gho_token",
      login: "toon",
      lastSyncedSha: "stale",
    });
    const { deps, output } = makeDeps({ fetchFn: fakeFetch({}) });
    await runGitHubCommand("connect toon/todos", deps);

    expect(await loadGitHubSettings()).toEqual({
      token: "gho_token",
      login: "toon",
      owner: "toon",
      repo: "todos",
      branch: "main",
      path: "todo.txt",
    });
    expect(output[0]).toBe(
      "Connected as toon.\nUpdated: sync target set to toon/todos:todo.txt (main)",
    );
  });

  it("keeps sync bookkeeping when reconnecting to the same target", async () => {
    await configureTarget({ lastSyncedSha: "keep-sha" });
    const { deps, output } = makeDeps({ fetchFn: fakeFetch({}) });
    await runGitHubCommand("connect toon/todos", deps);

    expect((await loadGitHubSettings()).lastSyncedSha).toBe("keep-sha");
    expect(output[0]).toBe(
      "Connected as toon.\nUpdated: sync target set to toon/todos:todo.txt (main)",
    );
  });

  it("accepts custom branch and path in connect when already connected", async () => {
    await storeGitHubSettings({ token: "gho_token", login: "toon" });
    const { deps, output } = makeDeps({ fetchFn: fakeFetch({}) });
    await runGitHubCommand("connect toon/todos develop lists/todo.txt", deps);

    expect(output[0]).toBe(
      "Connected as toon.\nUpdated: sync target set to toon/todos:lists/todo.txt (develop)",
    );
  });

  it("rejects traversal and empty segments in the connect path", async () => {
    for (const path of ["../secrets.txt", "a//b.txt", "./todo.txt", "a/.."]) {
      const { deps, output } = makeDeps({ fetchFn: fakeFetch({}) });
      await runGitHubCommand(`connect toon/todos main ${path}`, deps);

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
      "Not syncing yet - run 'connect <owner>/<repo>' to get started.",
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
    await runGitHubCommand("connect toon/todos", deps);

    expect(output[0]).toContain("no GitHub client id is configured");
  });

  it("connects via the device flow, stores the token, and sets the target", async () => {
    const fetchFn = fakeFetch(DEVICE_FLOW_ROUTES);
    const { deps, output } = makeDeps({ fetchFn });
    await runGitHubCommand("connect toon/todos", deps);

    expect(output[0]).toBe(
      "Visit https://github.com/login/device and enter code ABCD-1234.\n⠋ Waiting for authorization...",
    );
    expect(output[output.length - 1]).toBe(
      "Connected as toon.\nUpdated: sync target set to toon/todos:todo.txt (main)\nThis token can read and write every repo on your account - 'disconnect' revokes it.",
    );
    expect(await loadGitHubSettings()).toMatchObject({
      token: "gho_token",
      login: "toon",
      owner: "toon",
      repo: "todos",
    });
  });

  it("re-authorizes an existing target with bare connect", async () => {
    await storeGitHubSettings({
      owner: "toon",
      repo: "todos",
      branch: "main",
      path: "todo.txt",
      lastSyncedSha: "keep-sha",
    });
    const fetchFn = fakeFetch(DEVICE_FLOW_ROUTES);
    const { deps, output } = makeDeps({ fetchFn });
    await runGitHubCommand("connect", deps);

    expect(output[output.length - 1]).toContain("Connected as toon.");
    expect(await loadGitHubSettings()).toMatchObject({
      token: "gho_token",
      lastSyncedSha: "keep-sha",
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
    await runGitHubCommand("connect toon/todos", deps);

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
      "Error: not connected - run 'connect <owner>/<repo>' first.",
    );

    await storeGitHubSettings({ token: "gho_token" });
    const untargeted = makeDeps();
    await runGitHubCommand("sync restore", untargeted.deps);
    expect(untargeted.output[0]).toBe(
      "Error: no sync target - run 'connect <owner>/<repo>' first.",
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

    expect(output[0]).toBe("Saved: 2 tasks to toon/todos:todo.txt");
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
      "Warning: replaced a backup on GitHub that had changes you hadn't loaded.\nSaved: 2 tasks to toon/todos:todo.txt",
    );
    expect(await loadGitHubSettings()).toMatchObject({
      lastSyncedSha: "new-sha",
    });
  });

  it("warns once, then replaces local tasks when sync restore is run again", async () => {
    await configureTarget();
    const restoreConfirmation = createRestoreConfirmationStore();
    const fetchFn = fakeFetch({
      "GET https://api.github.com/repos/toon/todos/contents/todo.txt": () =>
        jsonResponse({
          sha: "remote-sha",
          content: encodeLines(["remote task"]),
        }),
    });

    const first = makeDeps({ fetchFn: fakeFetch({}), restoreConfirmation });
    await runGitHubCommand("sync restore", first.deps);
    expect(first.applied).toEqual([]);
    expect(first.output[0]).toBe(
      "Warning: you have local tasks that aren't backed up. Run 'sync restore' again to replace them.",
    );
    expect((await loadGitHubSettings()).lastSyncedSha).toBeUndefined();

    const second = makeDeps({ fetchFn, restoreConfirmation });
    await runGitHubCommand("sync restore", second.deps);
    expect(second.applied).toEqual([["remote task"]]);
    expect(second.output[second.output.length - 1]).toBe(
      "Loaded: 1 tasks from toon/todos:todo.txt",
    );
    expect(await loadGitHubSettings()).toMatchObject({
      lastSyncedSha: "remote-sha",
      lastSyncedHash: hashTodos(["remote task"]),
    });
  });

  it("withdraws the restore confirmation when the local tasks change", async () => {
    await configureTarget();
    const restoreConfirmation = createRestoreConfirmationStore();

    const first = makeDeps({ fetchFn: fakeFetch({}), restoreConfirmation });
    await runGitHubCommand("sync restore", first.deps);
    expect(first.output[0]).toContain("Run 'sync restore' again");

    // The tasks changed between the warning and the second run, so it
    // warns again instead of replacing them.
    const second = makeDeps({
      fetchFn: fakeFetch({}),
      getTodos: () => ["edited task"],
      restoreConfirmation,
    });
    await runGitHubCommand("sync restore", second.deps);
    expect(second.applied).toEqual([]);
    expect(second.output[0]).toContain("Run 'sync restore' again");
  });

  it("withdraws the restore confirmation when another command runs in between", async () => {
    await configureTarget();
    const restoreConfirmation = createRestoreConfirmationStore();

    const first = makeDeps({ fetchFn: fakeFetch({}), restoreConfirmation });
    await runGitHubCommand("sync restore", first.deps);
    expect(first.output[0]).toContain("Run 'sync restore' again");

    const status = makeDeps({ restoreConfirmation });
    await runGitHubCommand("sync status", status.deps);

    const second = makeDeps({ fetchFn: fakeFetch({}), restoreConfirmation });
    await runGitHubCommand("sync restore", second.deps);
    expect(second.applied).toEqual([]);
    expect(second.output[0]).toContain("Run 'sync restore' again");
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
