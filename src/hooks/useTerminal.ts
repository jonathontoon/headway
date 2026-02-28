import {
  useCallback,
  type ChangeEvent,
  type KeyboardEvent,
  type RefObject,
} from "react";
import { useTerminalController } from "@contexts/TerminalContext";
import { useAutocomplete } from "@hooks/useAutocomplete";
import { useTerminalEntries } from "@hooks/useTerminalEntries";
import type { TranscriptEntry } from "@reducers/terminal/terminalTypes";

export interface UseTerminalReturn {
  transcript: readonly TranscriptEntry[];
  input: string;
  onInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onInputKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
}

export const useTerminal = (
  inputRef: RefObject<HTMLInputElement | null>
): UseTerminalReturn => {
  const transcript = useTerminalEntries();
  const getAutocomplete = useAutocomplete();
  const { input, navigateHistory, setInput, submit } = useTerminalController();

  const onInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setInput(e.target.value);
    },
    [setInput]
  );

  const onInputKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        void submit(input);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        navigateHistory("up");
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        navigateHistory("down");
      } else if (e.key === "Escape") {
        e.preventDefault();
        setInput("");
      } else if (e.key === "Tab") {
        e.preventDefault();
        const cursorPos =
          (e.currentTarget.selectionStart ?? input.length);
        const result = getAutocomplete(input, cursorPos);
        if (result) {
          setInput(result.completed);
          setTimeout(() => {
            inputRef.current?.setSelectionRange(
              result.insertPosition,
              result.insertPosition
            );
          }, 0);
        }
      }
    },
    [getAutocomplete, input, inputRef, navigateHistory, setInput, submit]
  );

  return { transcript, input, onInputChange, onInputKeyDown };
};
