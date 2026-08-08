import { indexedDB } from "../../services/indexedDB";

const GITHUB_DB_KEY = "github-settings";

/** Default branch used when a sync target does not specify one. */
export const DEFAULT_BRANCH = "main";

/** Default repo file path used for todo sync. */
export const DEFAULT_PATH = "todo.txt";

/** Persisted GitHub sync settings and last-sync bookkeeping. */
export type GitHubSettings = {
  readonly owner?: string | undefined;
  readonly repo?: string | undefined;
  readonly branch?: string | undefined;
  readonly path?: string | undefined;
  readonly token?: string | undefined;
  readonly login?: string | undefined;
  readonly lastSyncedSha?: string | undefined;
  readonly lastSyncedHash?: string | undefined;
  readonly lastSyncedAt?: string | undefined;
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

// indexedDB is writable by anything running in the origin, so only the
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

/**
 * Loads sanitized GitHub sync settings from browser storage.
 *
 * @returns Stored settings with unknown fields removed.
 */
export async function loadGitHubSettings(): Promise<GitHubSettings> {
  const stored = await indexedDB.get<unknown>(GITHUB_DB_KEY);

  if (stored !== undefined) {
    return sanitizeSettings(stored);
  }

  return {};
}

/**
 * Stores GitHub sync settings in browser storage.
 *
 * @param settings - Settings to persist.
 * @returns Nothing.
 */
export async function storeGitHubSettings(
  settings: GitHubSettings,
): Promise<void> {
  // Structured clone rejects nothing here, but dropping undefined fields
  // keeps the stored record compact.
  await indexedDB.set(GITHUB_DB_KEY, JSON.parse(JSON.stringify(settings)));
}

/**
 * Hashes todo lines to detect local changes since the last sync.
 *
 * @param todos - Todo lines to hash.
 * @returns FNV-1a hash as an 8-character hex string.
 */
export function hashTodos(todos: readonly string[]): string {
  const text = todos.join("\n");
  let hash = 0x811c9dc5;

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}
