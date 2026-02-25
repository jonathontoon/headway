import { useCallback, type ChangeEvent, type KeyboardEvent } from "react";
import { useShallow } from "zustand/shallow";
import { useTerminalStore } from "@stores/useTerminalStore";

export interface UseTerminalReturn {
  input: string;
  onInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onInputKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
}

export const useTerminal = (): UseTerminalReturn => {
  const { input, setInput, navigateHistory, executeCommand } = useTerminalStore(
    useShallow((s) => ({
      input: s.input,
      setInput: s.setInput,
      navigateHistory: s.navigateHistory,
      executeCommand: s.executeCommand,
    }))
  );

  const onInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setInput(e.target.value);
    },
    [setInput]
  );

  const onInputKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") executeCommand(input);
      else if (e.key === "ArrowUp") {
        e.preventDefault();
        navigateHistory("up");
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        navigateHistory("down");
      }
    },
    [input, executeCommand, navigateHistory]
  );

  return { input, onInputChange, onInputKeyDown };
};
