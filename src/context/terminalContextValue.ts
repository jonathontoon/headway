import { createContext } from "react";
import { useTerminal } from "@store/useTerminal";

export type TerminalContextType = ReturnType<typeof useTerminal>;

export const TerminalContext = createContext<TerminalContextType | undefined>(
  undefined
);
