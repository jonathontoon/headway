import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type Ref,
  type SyntheticEvent,
} from "react";

type PromptSelection = {
  start: number;
  end: number;
};

type UsePromptSelectionResult = {
  handleInputRef: (node: HTMLInputElement | null) => void;
  handleKeyUp: (event: KeyboardEvent<HTMLInputElement>) => void;
  handleSelect: (event: SyntheticEvent<HTMLInputElement>) => void;
  beforeCaret: string;
  hasSelection: boolean;
  caretCharacter: string;
};

const readSelection = (
  input: HTMLInputElement | null,
  fallbackPosition: number
): PromptSelection => {
  if (!input) {
    return { start: fallbackPosition, end: fallbackPosition };
  }

  const fallback = input.value.length;

  return {
    start: input.selectionStart ?? fallback,
    end: input.selectionEnd ?? fallback,
  };
};

export const usePromptSelection = (
  value: string,
  forwardedRef?: Ref<HTMLInputElement>
): UsePromptSelectionResult => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selection, setSelection] = useState<PromptSelection>({
    start: value.length,
    end: value.length,
  });

  const syncSelection = useCallback(
    (input: HTMLInputElement | null = inputRef.current) => {
      const nextSelection = readSelection(input, value.length);

      setSelection((currentSelection) => {
        if (
          currentSelection.start === nextSelection.start &&
          currentSelection.end === nextSelection.end
        ) {
          return currentSelection;
        }

        return nextSelection;
      });
    },
    [value]
  );

  useLayoutEffect(() => {
    syncSelection();
  }, [syncSelection]);

  const handleInputRef = (node: HTMLInputElement | null) => {
    inputRef.current = node;

    if (typeof forwardedRef === "function") {
      forwardedRef(node);
      return;
    }

    if (forwardedRef) {
      forwardedRef.current = node;
    }
  };

  const handleKeyUp = (event: KeyboardEvent<HTMLInputElement>) => {
    syncSelection(event.currentTarget);
  };

  const handleSelect = (event: SyntheticEvent<HTMLInputElement>) => {
    syncSelection(event.currentTarget);
  };

  const caretIndex = selection.start;

  return {
    handleInputRef,
    handleKeyUp,
    handleSelect,
    beforeCaret: value.slice(0, caretIndex),
    hasSelection: selection.start !== selection.end,
    caretCharacter: value.charAt(caretIndex) || "\u00A0",
  };
};
