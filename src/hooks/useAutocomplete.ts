import { useTerminalController } from "@contexts/TerminalContext";

export const useAutocomplete = () => useTerminalController().getAutocomplete;
