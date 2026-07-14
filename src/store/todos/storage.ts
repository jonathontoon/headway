import { kvGet, kvSet } from "../db";

export const TODOS_STORAGE_KEY = "headway-todos";
const TODOS_DB_KEY = "todos";
const TODOS_CHANNEL_NAME = "headway-todos";

export const SAMPLE_TODOS: readonly string[] = [
  // OVERDUE (High priority stress test)
  "(A) 2026-06-15 Emergency: Fix production database bug +work @computer due:2026-07-08",
  "(A) 2026-06-18 Prepare quarterly budget review +work @computer due:2026-07-05",
  "(B) 2026-06-20 Pay electric bill +bills @online due:2026-07-09",
  "2026-06-22 Call plumber about basement leak @phone +home due:2026-07-07",
  "(C) 2026-06-25 Schedule Goodwill pickup @phone +GarageSale due:2026-07-04",

  // DUE TODAY (2026-07-10)
  "(A) 2026-07-08 Submit expense report +work @computer due:2026-07-10",
  "(B) 2026-07-09 Confirm meeting with marketing team @email +work due:2026-07-10",
  "2026-07-09 Grocery shopping for dinner party @errands +home due:2026-07-10",

  // UPCOMING (Next few days - with priority range D-Z)
  "(A) 2026-07-01 Finish presentation slides +work @computer due:2026-07-12",
  "(B) 2026-07-02 Book flight for conference +travel @phone due:2026-07-15",
  "(B) 2026-07-03 Review job applications +hiring @computer due:2026-07-14",
  "(C) 2026-07-04 Water plants and garden @home due:2026-07-13",
  "(D) 2026-07-05 Update project documentation +work @computer due:2026-07-19",
  "(E) 2026-07-05 Backup personal files @computer +maintenance due:2026-07-21",
  "(A) 2026-07-05 Fix leaky kitchen faucet @home +household due:2026-07-18",
  "(F) 2026-07-06 Organize old photos @home +hobby due:2026-07-28",
  "(G) 2026-07-06 Draft proposal for new feature +work @computer due:2026-07-16",

  // FURTHER FUTURE DATES
  "(B) 2026-07-08 Plan summer vacation itinerary +travel @computer due:2026-08-01",
  "2026-07-09 Schedule dental cleaning appointment @phone +health due:2026-07-25",
  "(C) 2026-06-30 Learn Go programming language @computer +skill-dev due:2026-09-01",
  "2026-06-28 Read that book everyone recommended @home due:2026-08-15",

  // NO DUE DATE (Someday/Maybe items - full priority range)
  "(A) 2026-06-01 Redesign company website +work @computer",
  "(B) 2026-06-10 Build personal portfolio +side-projects @computer",
  "(C) 2026-06-15 Explore new hiking trails @outdoor +recreational",
  "(D) 2026-07-01 Learn Spanish language +self-improvement @home",
  "(E) 2026-06-20 Install smart home security system @home +household",
  "(F) 2026-07-02 Research cloud migration strategy +work @computer",
  "(G) 2026-07-03 Write technical blog post about DevOps +side-projects @computer",
  "(H) 2026-07-01 Refactor legacy authentication system +work @computer",
  "(M) 2026-06-25 Experiment with new design tool +side-projects @computer",
  "(Z) 2026-06-30 Someday maybe: Learn Rust programming +skill-dev @computer",

  // COMPLETED TASKS (showing recent completions and older ones)
  "x 2026-07-09 2026-06-26 Send weekly status update to manager @email +work",
  "x 2026-07-08 2026-06-28 Fix CSS styling issues in dashboard @computer +work",
  "x 2026-07-07 2026-06-25 Attend team standup meeting @office +work",
  "x 2026-07-06 2026-06-20 Pay internet bill +bills @online",
  "x 2026-07-05 2026-06-18 Review pull requests from team @computer +work",
  "x 2026-07-04 2026-06-26 Review insurance renewal +bills @computer",
  "x 2026-07-03 2026-06-24 Send invoices to clients +work @computer",
  "x 2026-07-02 2026-06-23 Clean email inbox @computer @home",
  "x 2026-07-01 2026-06-22 Organize project files +work @computer",
  "x 2026-06-30 2026-06-15 Set up monitoring alerts +work @computer",

  // PROJECTS WITH MULTIPLE TAGS
  "(A) 2026-07-04 Research CI/CD solutions for infrastructure +DevOps @research @computer due:2026-07-20",
  "(B) 2026-07-05 Document API endpoints for third-party integration +work @documentation @computer due:2026-07-22",
  "2026-07-06 Setup monitoring and logging infrastructure +DevOps @infrastructure @computer due:2026-07-25",
];

// IndexedDB (and the broadcast channel) are writable by anything running
// in the origin, so every value read back is validated before use.
export function sanitizeTodos(value: unknown): readonly string[] | undefined {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : undefined;
}

export function parseStoredTodos(raw: string): readonly string[] | undefined {
  try {
    return sanitizeTodos(JSON.parse(raw));
  } catch {
    return undefined;
  }
}

// One-time migration from the pre-1.6 localStorage key. The key is removed
// after a successful IndexedDB write so there is a single source of truth.
async function migrateLegacyTodos(): Promise<readonly string[] | undefined> {
  const stored = localStorage.getItem(TODOS_STORAGE_KEY);
  const todos = stored ? parseStoredTodos(stored) : undefined;

  if (todos) {
    await kvSet(TODOS_DB_KEY, todos);
  }
  if (stored !== null) {
    localStorage.removeItem(TODOS_STORAGE_KEY);
  }

  return todos;
}

export async function loadStoredTodos(): Promise<readonly string[]> {
  const stored = sanitizeTodos(await kvGet(TODOS_DB_KEY));
  return stored ?? (await migrateLegacyTodos()) ?? SAMPLE_TODOS;
}

function openTodosChannel(): BroadcastChannel | undefined {
  return typeof BroadcastChannel === "undefined"
    ? undefined
    : new BroadcastChannel(TODOS_CHANNEL_NAME);
}

export async function storeTodos(todos: readonly string[]): Promise<void> {
  await kvSet(TODOS_DB_KEY, [...todos]);

  // IndexedDB writes don't fire `storage` events the way localStorage did,
  // so other open tabs are told explicitly.
  const channel = openTodosChannel();
  if (channel) {
    channel.postMessage([...todos]);
    channel.close();
  }
}

export function subscribeTodos(
  callback: (todos: readonly string[]) => void,
): () => void {
  const channel = openTodosChannel();
  if (!channel) {
    return () => {};
  }

  channel.onmessage = (event: MessageEvent) => {
    const todos = sanitizeTodos(event.data);
    if (todos) {
      callback(todos);
    }
  };

  return () => channel.close();
}
