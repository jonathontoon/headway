import type { ReactNode } from "react";
import { useTerminal } from "../contexts/TerminalContext";
import { TerminalContext } from "../contexts/TerminalContext";

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
