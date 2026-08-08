import { createContext } from "react";
import type { Direction } from "./direction";
import type { TerminalState } from "./types";

export type TerminalStore = {
  readonly state: TerminalState;
  readonly todos: readonly string[];
  readonly setCommand: (command: string) => void;
  readonly submitCommand: () => void;
  readonly navigateHistory: (direction: Direction) => void;
  readonly cancelCommand: () => void;
  readonly clearScreen: () => void;
};

export const TerminalContext = createContext<TerminalStore | null>(null);
