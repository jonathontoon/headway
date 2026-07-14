import {
  GitHubApiError,
  getAuthenticatedLogin,
  getFile,
  isValidPathSegment,
  isValidRepoPath,
  pollForToken,
  putFile,
  requestDeviceCode,
  revokeToken,
  type DeviceCode,
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

const GITHUB_VERBS = new Set(["connect", "disconnect", "sync"]);

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
      case "connect":
        await runConnect(deps);
        return;
      case "disconnect":
        await runDisconnect(deps);
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
    return "Error: GitHub rejected the token - run 'connect' again.";
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

const RELATIVE_TIME_FORMATTER = new Intl.RelativeTimeFormat("en", {
  numeric: "auto",
});
const RELATIVE_TIME_UNITS: readonly [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 60 * 60 * 24 * 365],
  ["month", 60 * 60 * 24 * 30],
  ["week", 60 * 60 * 24 * 7],
  ["day", 60 * 60 * 24],
  ["hour", 60 * 60],
  ["minute", 60],
];

function formatRelativeTime(iso: string): string {
  const diffSeconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);

  for (const [unit, secondsInUnit] of RELATIVE_TIME_UNITS) {
    if (diffSeconds >= secondsInUnit) {
      return RELATIVE_TIME_FORMATTER.format(
        -Math.round(diffSeconds / secondsInUnit),
        unit,
      );
    }
  }

  return "just now";
}

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const SPINNER_TICK_MS = 90;

function startSpinner(
  deps: GitHubCommandDeps,
  label: string,
): ReturnType<typeof setInterval> {
  const render = (frame: string, replace: boolean) =>
    deps.emit(`${frame} ${label}`, { replace });

  render(SPINNER_FRAMES[0], false);

  let frameIndex = 0;
  return setInterval(() => {
    frameIndex = (frameIndex + 1) % SPINNER_FRAMES.length;
    render(SPINNER_FRAMES[frameIndex], true);
  }, SPINNER_TICK_MS);
}

async function runConnect(deps: GitHubCommandDeps): Promise<void> {
  if (!deps.clientId) {
    deps.emit(
      "Error: no GitHub client id is configured - set VITE_GITHUB_CLIENT_ID and rebuild.",
    );
    return;
  }

  const connectingSpinnerId = startSpinner(deps, "Connecting to GitHub...");
  let device: DeviceCode;
  try {
    device = await requestDeviceCode(deps.clientId, deps.fetchFn, deps.signal);
  } catch (error) {
    if (!isAbortError(error)) {
      deps.emit(formatError(error), { replace: true });
    }
    return;
  } finally {
    clearInterval(connectingSpinnerId);
  }

  const renderWaiting = (frame: string, replace: boolean) =>
    deps.emit(
      [
        `Visit ${device.verificationUri} and enter code ${device.userCode}.`,
        `${frame} Waiting for authorization...`,
      ].join("\n"),
      { replace },
    );

  renderWaiting(SPINNER_FRAMES[0], true);

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

    await storeGitHubSettings({ ...(await loadGitHubSettings()), token, login });
    deps.emit(
      [
        `Connected as ${login}.`,
        "This token can read and write every repo on your account - 'disconnect' revokes it.",
      ].join("\n"),
    );
  } finally {
    clearInterval(spinnerId);
  }
}

async function runDisconnect(deps: GitHubCommandDeps): Promise<void> {
  const settings = await loadGitHubSettings();

  if (!settings.token) {
    deps.emit("No GitHub connection to disconnect.");
    return;
  }

  // Clear local state first so disconnect always takes effect locally even
  // when revocation fails; the token itself stays valid on GitHub until
  // revoked, so the fallback message points at the manual revoke page.
  await storeGitHubSettings({ ...settings, token: undefined, login: undefined });

  let revoked = false;
  try {
    revoked =
      (await revokeToken(settings.token, deps.fetchFn, deps.signal)) ===
      "revoked";
  } catch (error) {
    if (isAbortError(error)) throw error;
  }

  deps.emit(
    revoked
      ? "Disconnected from GitHub and revoked the token."
      : "Disconnected from GitHub, but the token could not be revoked automatically - review it at https://github.com/settings/applications.",
  );
}

async function runSync(
  args: readonly string[],
  deps: GitHubCommandDeps,
): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case undefined:
    case "status":
      await runStatus(deps);
      return;
    case "setup":
      await runSetup(rest, deps);
      return;
    case "backup":
      await runBackup(deps);
      return;
    case "restore":
      await runRestore(rest, deps);
      return;
    default:
      deps.emit(
        `Error: sync ${subcommand} is not a recognized command. Try 'sync setup', 'sync status', 'sync backup' or 'sync restore'.`,
      );
  }
}

async function runSetup(
  args: readonly string[],
  deps: GitHubCommandDeps,
): Promise<void> {
  const match = args[0]?.match(/^([^/\s]+)\/([^/\s]+)$/);

  if (!match) {
    deps.emit("Error: usage: sync setup <owner>/<repo> [branch] [path].");
    return;
  }

  const path = args[2] ?? DEFAULT_PATH;

  if (
    !isValidPathSegment(match[1]) ||
    !isValidPathSegment(match[2]) ||
    !isValidRepoPath(path)
  ) {
    deps.emit(
      "Error: path must be a relative file path without '.' or '..' segments.",
    );
    return;
  }

  const target: SyncTarget = {
    owner: match[1],
    repo: match[2],
    branch: args[1] ?? DEFAULT_BRANCH,
    path,
  };
  await storeGitHubSettings({
    ...(await loadGitHubSettings()),
    ...target,
    lastSyncedSha: undefined,
    lastSyncedHash: undefined,
    lastSyncedAt: undefined,
  });
  deps.emit(`Updated: sync target set to ${describeTarget(target)}`);
}

async function runStatus(deps: GitHubCommandDeps): Promise<void> {
  const settings = await loadGitHubSettings();
  const target = targetFrom(settings);
  const login = settings.login;

  if (!target) {
    deps.emit(
      login
        ? `Syncing isn't set up yet, though you're connected as ${login} - run 'sync setup <owner>/<repo>' to choose a repo.`
        : "Not syncing yet - run 'sync setup <owner>/<repo>' then 'connect' to get started.",
    );
    return;
  }

  if (!login) {
    deps.emit(
      `Syncing target is set to ${describeTarget(target)}, but you're not connected - run 'connect' to finish setup.`,
    );
    return;
  }

  if (settings.lastSyncedHash === undefined) {
    deps.emit(
      `Syncing to ${describeTarget(target)} as ${login} - nothing's been saved yet, run 'sync backup' to save your tasks.`,
    );
    return;
  }

  const dirty = hashTodos(deps.getTodos()) !== settings.lastSyncedHash;
  const lastBackup = settings.lastSyncedAt
    ? ` (last backup ${formatRelativeTime(settings.lastSyncedAt)})`
    : "";
  deps.emit(
    dirty
      ? `Syncing to ${describeTarget(target)} as ${login} - you have unsaved changes, run 'sync backup' to save them.`
      : `Syncing to ${describeTarget(target)} as ${login} - everything's saved${lastBackup}.`,
  );
}

type SyncSession = {
  readonly settings: GitHubSettings;
  readonly target: SyncTarget;
  readonly token: string;
};

async function requireSession(
  deps: GitHubCommandDeps,
): Promise<SyncSession | undefined> {
  const settings = await loadGitHubSettings();

  if (!settings.token) {
    deps.emit("Error: not connected - run 'connect' first.");
    return undefined;
  }

  const target = targetFrom(settings);

  if (!target) {
    deps.emit("Error: no sync target - run 'sync setup <owner>/<repo>' first.");
    return undefined;
  }

  return { settings, target, token: settings.token };
}

// Every backup is its own commit, so an overwrite is never actually
// destructive - the previous version is still in the repo's history on
// GitHub. Conflicts are surfaced as a warning rather than blocked.
async function runBackup(deps: GitHubCommandDeps): Promise<void> {
  const session = await requireSession(deps);

  if (!session) {
    return;
  }

  const spinnerId = startSpinner(deps, "Saving to GitHub...");
  try {
    const todos = deps.getTodos();
    const remote = await getFile(
      session.target,
      session.token,
      deps.fetchFn,
      deps.signal,
    );
    let sha: string | undefined;
    let warning = "";

    if (remote !== "not_found") {
      sha = remote.sha;

      if (remote.sha !== session.settings.lastSyncedSha) {
        warning = "Warning: overwrote a version already saved on GitHub.\n";
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
    await storeGitHubSettings({
      ...(await loadGitHubSettings()),
      lastSyncedSha: newSha,
      lastSyncedHash: hashTodos(todos),
      lastSyncedAt: new Date().toISOString(),
    });
    deps.emit(
      `${warning}Saved: ${todos.length} tasks to ${session.target.owner}/${session.target.repo}:${session.target.path} (${newSha.slice(0, 7)})`,
      { replace: true },
    );
  } catch (error) {
    if (!isAbortError(error)) {
      deps.emit(formatError(error), { replace: true });
    }
  } finally {
    clearInterval(spinnerId);
  }
}

async function runRestore(
  args: readonly string[],
  deps: GitHubCommandDeps,
): Promise<void> {
  const session = await requireSession(deps);

  if (!session) {
    return;
  }

  const dirty =
    session.settings.lastSyncedHash === undefined ||
    hashTodos(deps.getTodos()) !== session.settings.lastSyncedHash;

  // Restoring replaces local tasks outright, and unlike a backup there is
  // no git history to recover them from - so an explicit --force is
  // required instead of a warning after the data is already gone.
  if (dirty && !args.includes("--force")) {
    deps.emit(
      "Error: this would replace local tasks that aren't backed up - run 'sync restore --force' to continue.",
    );
    return;
  }

  const spinnerId = startSpinner(deps, "Loading from GitHub...");
  try {
    const remote = await getFile(
      session.target,
      session.token,
      deps.fetchFn,
      deps.signal,
    );

    if (remote === "not_found") {
      deps.emit(
        `Error: ${session.target.path} not found in ${session.target.owner}/${session.target.repo} - run 'sync backup' first.`,
        { replace: true },
      );
      return;
    }

    const warning = dirty
      ? "Warning: replaced local changes that weren't saved.\n"
      : "";

    deps.applyTodos(remote.lines);
    await storeGitHubSettings({
      ...(await loadGitHubSettings()),
      lastSyncedSha: remote.sha,
      lastSyncedHash: hashTodos(remote.lines),
      lastSyncedAt: new Date().toISOString(),
    });
    deps.emit(
      `${warning}Loaded: ${remote.lines.length} tasks from ${session.target.owner}/${session.target.repo}:${session.target.path} (${remote.sha.slice(0, 7)})`,
      { replace: true },
    );
  } catch (error) {
    if (!isAbortError(error)) {
      deps.emit(formatError(error), { replace: true });
    }
  } finally {
    clearInterval(spinnerId);
  }
}
