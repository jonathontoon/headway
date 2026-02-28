import {
  useCallback,
  type ChangeEvent,
  type KeyboardEvent,
  type RefObject,
} from "react";
import { useStore } from "@nanostores/react";
import { $input, executeCommand, navigateHistory } from "@stores/terminal";
import { getAutocomplete } from "@utils/autocomplete";

export interface UseTerminalReturn {
  input: string;
  onInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onInputKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
}

export const useTerminal = (
  inputRef: RefObject<HTMLInputElement | null>
): UseTerminalReturn => {
  const input = useStore($input);

  const onInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    $input.set(e.target.value);
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
      } else if (e.key === "Escape") {
        e.preventDefault();
        $input.set("");
      } else if (e.key === "Tab") {
        e.preventDefault();
        const cursorPos =
          (e.target as HTMLInputElement).selectionStart ?? input.length;
        const result = getAutocomplete(input, cursorPos);
        if (result) {
          $input.set(result.completed);
          // Schedule cursor position update after state update
          setTimeout(() => {
            if (inputRef.current) {
              inputRef.current.setSelectionRange(
                result.insertPosition,
                result.insertPosition
              );
            }
          }, 0);
        }
      }
    },
    [input, inputRef]
  );

  return { input, onInputChange, onInputKeyDown };
};
