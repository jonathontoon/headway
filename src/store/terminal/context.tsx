import { createContext } from "react";
import type { Direction } from "./direction";
import type { TerminalState } from "./types";

/** Data and actions exposed to terminal React components. */
export type TerminalStore = {
  readonly state: TerminalState;
  readonly todos: readonly string[];
  readonly setCommand: (command: string) => void;
  readonly submitCommand: () => void;
  readonly navigateHistory: (direction: Direction) => void;
  readonly cancelCommand: () => void;
  readonly clearScreen: () => void;
};

/** React context for the terminal store. */
export const TerminalContext = createContext<TerminalStore | null>(null);
