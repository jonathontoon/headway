import {
  GitHubApiError,
  getAuthenticatedLogin,
  getFile,
  pollForToken,
  putFile,
  requestDeviceCode,
  type FetchFn,
  type SyncTarget,
  type WaitFn,
} from "./api";
import {
  DEFAULT_BRANCH,
  DEFAULT_PATH,
  hashTodos,
  loadGitHubSettings,
  storeGitHubSettings,
  type GitHubSettings,
} from "./settings";

export type GitHubCommandDeps = {
  readonly getTodos: () => readonly string[];
  readonly emit: (
    output: string,
    options?: { readonly replace?: boolean },
  ) => void;
  readonly applyTodos: (todos: readonly string[]) => void;
  readonly clientId: string | undefined;
  readonly fetchFn?: FetchFn;
  readonly waitFn?: WaitFn;
  readonly signal?: AbortSignal;
};

function isAbortError(error: unknown): boolean {
  // DOMException (what fetch/AbortController reject with) is not
  // consistently `instanceof Error` across engines, so check by name.
  return Boolean(
    error &&
    typeof error === "object" &&
    "name" in error &&
    (error as { name?: unknown }).name === "AbortError",
  );
}

const GITHUB_VERBS = new Set(["login", "logout", "sync"]);

export function isGitHubCommand(command: string): boolean {
  const [verb] = command.trim().split(/\s+/);
  return GITHUB_VERBS.has(verb);
}

export async function runGitHubCommand(
  command: string,
  deps: GitHubCommandDeps,
): Promise<void> {
  const [verb, ...args] = command.trim().split(/\s+/);

  try {
    switch (verb) {
      case "login":
        await runLogin(deps);
        return;
      case "logout":
        runLogout(deps);
        return;
      case "sync":
        await runSync(args, deps);
        return;
    }
  } catch (error) {
    if (isAbortError(error)) return;
    deps.emit(formatError(error));
  }
}

function formatError(error: unknown): string {
  if (error instanceof GitHubApiError && error.status === 401) {
    return "Error: GitHub rejected the token - run 'login' again.";
  }

  const message = error instanceof Error ? error.message : String(error);
  return `Error: ${message}.`;
}

function targetFrom(settings: GitHubSettings): SyncTarget | undefined {
  if (!settings.owner || !settings.repo) {
    return undefined;
  }

  return {
    owner: settings.owner,
    repo: settings.repo,
    branch: settings.branch ?? DEFAULT_BRANCH,
    path: settings.path ?? DEFAULT_PATH,
  };
}

function describeTarget(target: SyncTarget): string {
  return `${target.owner}/${target.repo}:${target.path} (${target.branch})`;
}

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const SPINNER_TICK_MS = 90;

async function runLogin(deps: GitHubCommandDeps): Promise<void> {
  if (!deps.clientId) {
    deps.emit(
      "Error: no GitHub client id is configured - set VITE_GITHUB_CLIENT_ID and rebuild.",
    );
    return;
  }

  const device = await requestDeviceCode(
    deps.clientId,
    deps.fetchFn,
    deps.signal,
  );
  const renderWaiting = (frame: string, replace: boolean) =>
    deps.emit(
      [
        `Visit ${device.verificationUri} and enter code ${device.userCode}`,
        `${frame} Waiting for authorization...`,
      ].join("\n"),
      { replace },
    );

  renderWaiting(SPINNER_FRAMES[0], false);

  // The spinner animates on its own clock; the network poll runs on
  // GitHub's much slower interval (typically every 5s), so tying the two
  // together made the spinner look frozen between polls.
  let frameIndex = 0;
  const spinnerId = setInterval(() => {
    frameIndex = (frameIndex + 1) % SPINNER_FRAMES.length;
    renderWaiting(SPINNER_FRAMES[frameIndex], true);
  }, SPINNER_TICK_MS);

  try {
    const token = await pollForToken(
      deps.clientId,
      device,
      deps.fetchFn,
      deps.waitFn,
      deps.signal,
    );
    const login = await getAuthenticatedLogin(token, deps.fetchFn, deps.signal);

    storeGitHubSettings({ ...loadGitHubSettings(), token, login });
    deps.emit(`Logged in as ${login}.`);
  } finally {
    clearInterval(spinnerId);
  }
}

function runLogout(deps: GitHubCommandDeps): void {
  const settings = loadGitHubSettings();

  if (!settings.token) {
    deps.emit("No GitHub session to log out of.");
    return;
  }

  storeGitHubSettings({ ...settings, token: undefined, login: undefined });
  deps.emit("Logged out of GitHub.");
}

async function runSync(
  args: readonly string[],
  deps: GitHubCommandDeps,
): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case undefined:
    case "status":
      runStatus(deps);
      return;
    case "setup":
      runSetup(rest, deps);
      return;
    case "push":
      await runPush(rest.includes("--force"), deps);
      return;
    case "pull":
      await runPull(rest.includes("--force"), deps);
      return;
    default:
      deps.emit(
        `sync ${subcommand} is not a recognized command. Try 'sync setup', 'sync status', 'sync push' or 'sync pull'.`,
      );
  }
}

function runSetup(args: readonly string[], deps: GitHubCommandDeps): void {
  const match = args[0]?.match(/^([^/\s]+)\/([^/\s]+)$/);

  if (!match) {
    deps.emit("Error: usage: sync setup <owner>/<repo> [branch] [path].");
    return;
  }

  const target: SyncTarget = {
    owner: match[1],
    repo: match[2],
    branch: args[1] ?? DEFAULT_BRANCH,
    path: args[2] ?? DEFAULT_PATH,
  };
  storeGitHubSettings({
    ...loadGitHubSettings(),
    ...target,
    lastSyncedSha: undefined,
    lastSyncedHash: undefined,
  });
  deps.emit(`Updated: sync target set to ${describeTarget(target)}`);
}

function runStatus(deps: GitHubCommandDeps): void {
  const settings = loadGitHubSettings();
  const target = targetFrom(settings);

  const targetLine = target
    ? `target: ${describeTarget(target)}`
    : "target: not set - run 'sync setup <owner>/<repo>'";
  const accountLine = settings.login
    ? `account: ${settings.login}`
    : "account: not logged in - run 'login'";

  let stateLine = "state: never synced";
  if (settings.lastSyncedHash !== undefined) {
    const dirty = hashTodos(deps.getTodos()) !== settings.lastSyncedHash;
    stateLine = dirty
      ? "state: local changes not pushed"
      : `state: clean, synced at ${settings.lastSyncedSha?.slice(0, 7)}`;
  }

  deps.emit([targetLine, accountLine, stateLine].join("\n"));
}

type SyncSession = {
  readonly settings: GitHubSettings;
  readonly target: SyncTarget;
  readonly token: string;
};

function requireSession(deps: GitHubCommandDeps): SyncSession | undefined {
  const settings = loadGitHubSettings();

  if (!settings.token) {
    deps.emit("Error: not logged in - run 'login' first.");
    return undefined;
  }

  const target = targetFrom(settings);

  if (!target) {
    deps.emit("Error: no sync target - run 'sync setup <owner>/<repo>' first.");
    return undefined;
  }

  return { settings, target, token: settings.token };
}

async function runPush(force: boolean, deps: GitHubCommandDeps): Promise<void> {
  const session = requireSession(deps);

  if (!session) {
    return;
  }

  const todos = deps.getTodos();
  const remote = await getFile(
    session.target,
    session.token,
    deps.fetchFn,
    deps.signal,
  );
  let sha: string | undefined;

  if (remote !== "not_found") {
    sha = remote.sha;

    if (!force && remote.sha !== session.settings.lastSyncedSha) {
      deps.emit(
        "Error: the remote file changed since the last sync - run 'sync pull' first or 'sync push --force'.",
      );
      return;
    }
  }

  const newSha = await putFile(
    session.target,
    session.token,
    todos,
    sha,
    deps.fetchFn,
    deps.signal,
  );
  storeGitHubSettings({
    ...loadGitHubSettings(),
    lastSyncedSha: newSha,
    lastSyncedHash: hashTodos(todos),
  });
  deps.emit(
    `Pushed: ${todos.length} tasks to ${session.target.owner}/${session.target.repo}:${session.target.path} (${newSha.slice(0, 7)})`,
  );
}

async function runPull(force: boolean, deps: GitHubCommandDeps): Promise<void> {
  const session = requireSession(deps);

  if (!session) {
    return;
  }

  const dirty =
    session.settings.lastSyncedHash === undefined ||
    hashTodos(deps.getTodos()) !== session.settings.lastSyncedHash;

  if (dirty && !force) {
    deps.emit(
      "Error: local changes have not been pushed - run 'sync push' or 'sync pull --force'.",
    );
    return;
  }

  const remote = await getFile(
    session.target,
    session.token,
    deps.fetchFn,
    deps.signal,
  );

  if (remote === "not_found") {
    deps.emit(
      `Error: ${session.target.path} not found in ${session.target.owner}/${session.target.repo} - run 'sync push' first.`,
    );
    return;
  }

  deps.applyTodos(remote.lines);
  storeGitHubSettings({
    ...loadGitHubSettings(),
    lastSyncedSha: remote.sha,
    lastSyncedHash: hashTodos(remote.lines),
  });
  deps.emit(
    `Pulled: ${remote.lines.length} tasks from ${session.target.owner}/${session.target.repo}:${session.target.path} (${remote.sha.slice(0, 7)})`,
  );
}
