import { useContext } from "react";
import { TerminalContext } from "../store/terminal/context";

/**
 * Reads the terminal store from React context.
 *
 * @returns The terminal store.
 * @throws When used outside `TerminalProvider`.
 */
export function useTerminal() {
  const terminal = useContext(TerminalContext);

  if (!terminal) {
    throw new Error("useTerminal must be used within a TerminalProvider");
  }

  return terminal;
}
