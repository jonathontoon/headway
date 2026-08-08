/** Command history navigation directions. */
export const Direction = {
  Previous: "previous",
  Next: "next",
} as const;

/** Supported command history navigation direction. */
export type Direction = (typeof Direction)[keyof typeof Direction];
