export const TODOS_STORAGE_KEY = "headway-todos";

export const SAMPLE_TODOS: readonly string[] = [
  "2026-06-20 Pay electric bill +bills due:2026-06-28",
  "(B) 2026-06-25 Schedule Goodwill pickup @phone +GarageSale due:2026-07-04",
  "(C) 2026-06-30 Fix leaky faucet @home",
  "2026-06-30 Submit quarterly report +work @computer",
  "2026-06-29 Post signs around the neighborhood +GarageSale",
  "2026-06-28 Sort donation boxes +GarageSale",
  "2026-06-27 Book dentist appointment @phone due:2026-07-12",
  "x 2026-07-03 2026-06-26 Review insurance renewal +bills",
  "x 2026-07-02 2026-06-25 Send invoices +work @computer",
  "x 2026-07-01 2026-06-24 Clean email inbox @computer",
];

export function loadStoredTodos(): readonly string[] {
  const stored = localStorage.getItem(TODOS_STORAGE_KEY);

  if (!stored) {
    return SAMPLE_TODOS;
  }

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : SAMPLE_TODOS;
  } catch {
    return SAMPLE_TODOS;
  }
}

export function storeTodos(todos: readonly string[]): void {
  localStorage.setItem(TODOS_STORAGE_KEY, JSON.stringify(todos));
}
