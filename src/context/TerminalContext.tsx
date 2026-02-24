import type { ReactNode } from "react";
import { useTerminal } from "@store/useTerminal";
import { TerminalContext } from "./terminalContextValue";

interface TerminalProviderProps {
  children: ReactNode;
}

export const TerminalProvider = ({ children }: TerminalProviderProps) => {
  const terminal = useTerminal();
  return (
    <TerminalContext.Provider value={terminal}>
      {children}
    </TerminalContext.Provider>
  );
};
