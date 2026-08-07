import type { TerminalOutput } from "./output";

export type TerminalEntry = {
  readonly id: number;
  readonly command?: string | undefined;
  readonly output?: TerminalOutput | undefined;
};

export type TerminalState = {
  readonly entries: readonly TerminalEntry[];
  readonly command: string;
  readonly historyIndex: number | null;
  readonly todos: readonly string[];
  readonly view: readonly number[];
  readonly pending: boolean;
};
