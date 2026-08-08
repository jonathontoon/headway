import type { TerminalOutput } from "./output";

/** One terminal history item with an optional command and output. */
export type TerminalEntry = {
  readonly id: number;
  readonly command?: string | undefined;
  readonly output?: TerminalOutput | undefined;
};

/** Complete terminal UI state managed by the reducer. */
export type TerminalState = {
  readonly entries: readonly TerminalEntry[];
  readonly command: string;
  readonly historyIndex: number | null;
  readonly view: readonly number[];
  readonly pending: boolean;
};
