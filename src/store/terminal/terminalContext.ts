import { createContext } from "react";
import type { TerminalState } from "./types";

export type TerminalStore = {
  readonly state: TerminalState;
  readonly setCommand: (command: string) => void;
  readonly submitCommand: () => void;
  readonly navigateHistory: (direction: "previous" | "next") => void;
  readonly cancelCommand: () => void;
  readonly clearScreen: () => void;
};

export const TerminalContext = createContext<TerminalStore | null>(null);
