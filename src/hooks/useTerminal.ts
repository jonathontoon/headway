import { useCallback, type ChangeEvent, type KeyboardEvent } from "react";
import { useAtom, useSetAtom } from "jotai";
import {
  inputAtom,
  executeCommandAtom,
  navigateHistoryAtom,
} from "@atoms/terminalAtoms";

export interface UseTerminalReturn {
  input: string;
  onInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onInputKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
}

export const useTerminal = (): UseTerminalReturn => {
  const [input, setInput] = useAtom(inputAtom);
  const executeCommand = useSetAtom(executeCommandAtom);
  const navigateHistory = useSetAtom(navigateHistoryAtom);

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
