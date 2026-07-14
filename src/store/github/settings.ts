import { kvGet, kvSet } from "../db";

export const GITHUB_STORAGE_KEY = "headway-github";
const GITHUB_DB_KEY = "github-settings";

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

// IndexedDB is writable by anything running in the origin (no safer than
// localStorage on that front), so only the known keys survive, and only
// when they hold strings.
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

// One-time migration from the pre-1.6 localStorage key. The key is removed
// after a successful IndexedDB write so there is a single source of truth.
async function migrateLegacySettings(): Promise<GitHubSettings | undefined> {
  const stored = localStorage.getItem(GITHUB_STORAGE_KEY);

  if (stored === null) {
    return undefined;
  }

  let settings: GitHubSettings;
  try {
    settings = sanitizeSettings(JSON.parse(stored));
  } catch {
    settings = {};
  }

  await kvSet(GITHUB_DB_KEY, settings);
  localStorage.removeItem(GITHUB_STORAGE_KEY);
  return settings;
}

export async function loadGitHubSettings(): Promise<GitHubSettings> {
  const stored = await kvGet(GITHUB_DB_KEY);

  if (stored !== undefined) {
    return sanitizeSettings(stored);
  }

  return (await migrateLegacySettings()) ?? {};
}

export async function storeGitHubSettings(
  settings: GitHubSettings,
): Promise<void> {
  // Structured clone rejects nothing here, but dropping undefined fields
  // keeps the stored record identical to the old JSON form.
  await kvSet(GITHUB_DB_KEY, JSON.parse(JSON.stringify(settings)));
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
