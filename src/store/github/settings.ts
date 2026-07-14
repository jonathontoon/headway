export const GITHUB_STORAGE_KEY = "headway-github";

export const DEFAULT_BRANCH = "main";
export const DEFAULT_PATH = "todo.txt";

export type GitHubSettings = {
  readonly owner?: string;
  readonly repo?: string;
  readonly branch?: string;
  readonly path?: string;
  readonly token?: string;
  readonly login?: string;
  readonly lastSyncedSha?: string;
  readonly lastSyncedHash?: string;
  readonly lastSyncedAt?: string;
};

const SETTINGS_KEYS = [
  "owner",
  "repo",
  "branch",
  "path",
  "token",
  "login",
  "lastSyncedSha",
  "lastSyncedHash",
  "lastSyncedAt",
] as const;

// localStorage is writable by anything running in the origin, so only the
// known keys survive, and only when they hold strings.
function sanitizeSettings(value: unknown): GitHubSettings {
  if (typeof value !== "object" || value === null) {
    return {};
  }

  const record = value as Record<string, unknown>;
  const settings: Partial<Record<(typeof SETTINGS_KEYS)[number], string>> = {};

  for (const key of SETTINGS_KEYS) {
    const field = record[key];
    if (typeof field === "string") {
      settings[key] = field;
    }
  }

  return settings;
}

export function loadGitHubSettings(): GitHubSettings {
  const stored = localStorage.getItem(GITHUB_STORAGE_KEY);

  if (!stored) {
    return {};
  }

  try {
    return sanitizeSettings(JSON.parse(stored));
  } catch {
    return {};
  }
}

export function storeGitHubSettings(settings: GitHubSettings): void {
  localStorage.setItem(GITHUB_STORAGE_KEY, JSON.stringify(settings));
}

// FNV-1a over the joined lines; detects local changes since the last sync.
export function hashTodos(todos: readonly string[]): string {
  const text = todos.join("\n");
  let hash = 0x811c9dc5;

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}
