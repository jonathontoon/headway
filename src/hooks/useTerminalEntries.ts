import { useTerminalState } from "@contexts/TerminalContext";

export const useTerminalEntries = () => useTerminalState().transcript;
