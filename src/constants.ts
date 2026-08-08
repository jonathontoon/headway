// Terminal UI
export const TERMINAL_PROMPT = "~$";

// Single canonical vertical gap used for every block break in the terminal:
// between commands, between a command line and its output, and between
// sections within a single command's output. Kept as full class strings
// (rather than a raw "1rem" value) so Tailwind's content scanner picks them
// up wherever they're referenced.
export const TERMINAL_BLOCK_GAP_MB = "mb-[1rem]";
export const TERMINAL_BLOCK_GAP_H = "h-[1rem]";

// Keyboard navigation
export const KEYBOARD_KEYS = {
  arrowUp: "ArrowUp",
  arrowDown: "ArrowDown",
  tab: "Tab",
} as const;

// IndexedDB configuration
export const INDEXED_DB_OPTIONS = {
  dbName: "headway",
  storeName: "kv",
} as const;
