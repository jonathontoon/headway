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
};

export function loadGitHubSettings(): GitHubSettings {
  const stored = localStorage.getItem(GITHUB_STORAGE_KEY);

  if (!stored) {
    return {};
  }

  try {
    const parsed: unknown = JSON.parse(stored);
    return typeof parsed === "object" && parsed !== null
      ? (parsed as GitHubSettings)
      : {};
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
