import { useContext } from "react";
import { TerminalContext } from "./terminalContextValue";

export const useTerminalStore = () => {
  const context = useContext(TerminalContext);
  if (!context) {
    throw new Error("useTerminalStore must be used within TerminalProvider");
  }
  return context;
};
