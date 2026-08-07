export const Direction = {
  Previous: "previous",
  Next: "next",
} as const;

export type Direction = (typeof Direction)[keyof typeof Direction];
