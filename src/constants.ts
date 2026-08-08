/** Prompt text shown before typed terminal commands. */
export const TERMINAL_PROMPT = "~$";

/**
 * Bottom margin class used for each terminal block break.
 *
 * @remarks
 * Keep this as a full Tailwind class string so Tailwind can find it.
 */
export const TERMINAL_BLOCK_GAP_MB = "mb-[1rem]";

/** Height class used for empty terminal spacer rows. */
export const TERMINAL_BLOCK_GAP_H = "h-[1rem]";

/** Keyboard key names used by terminal command navigation. */
export const KEYBOARD_KEYS = {
  arrowUp: "ArrowUp",
  arrowDown: "ArrowDown",
  tab: "Tab",
} as const;

/** IndexedDB database and object-store names used by app persistence. */
export const INDEXED_DB_OPTIONS = {
  dbName: "headway",
  storeName: "kv",
} as const;
