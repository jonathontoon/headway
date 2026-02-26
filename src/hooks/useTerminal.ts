import { useCallback, type ChangeEvent, type KeyboardEvent } from "react";
import { useStore } from "@nanostores/react";
import {
  inputAtom,
  executeCommand,
  navigateHistory,
} from "@atoms/terminalAtoms";

export interface UseTerminalReturn {
  input: string;
  onInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onInputKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
}

export const useTerminal = (): UseTerminalReturn => {
  const input = useStore(inputAtom);

  const onInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    inputAtom.set(e.target.value);
  }, []);

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
    [input]
  );

  return { input, onInputChange, onInputKeyDown };
};
