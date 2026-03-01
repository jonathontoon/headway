import {
  useLayoutEffect,
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type SyntheticEvent,
} from "react";
import { TERMINAL_INPUT_LABEL } from "../../constants";
import type { PromptProps } from "../../types";

type PromptSelection = {
  start: number;
  end: number;
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

const PromptPrefix = () => (
  <span aria-hidden="true" className="flex items-center gap-0">
    <span className="select-none text-cyan-300">~</span>
    <span className="select-none text-white">$</span>
  </span>
);

const Prompt = (props: PromptProps) => {
  const { value, readOnly } = props;
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
    if (readOnly) {
      return;
    }

    syncSelection();
  }, [readOnly, value, syncSelection]);

  if (readOnly) {
    return (
      <div className="flex items-center gap-1">
        <PromptPrefix />
        <span className="text-terminal-text">{value}</span>
      </div>
    );
  }

  const caretIndex = selection.start;
  const hasSelection = selection.start !== selection.end;
  const beforeCaret = value.slice(0, caretIndex);
  const currentCharacter = value.charAt(caretIndex);
  const caretCharacter = currentCharacter === "" ? "\u00A0" : currentCharacter;

  const handleInputRef = (node: HTMLInputElement | null) => {
    inputRef.current = node;

    if (typeof props.ref === "function") {
      props.ref(node);
      return;
    }

    if (props.ref) {
      (props.ref as { current: HTMLInputElement | null }).current = node;
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    props.onChange(event);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    props.onKeyDown(event);
  };

  const handleKeyUp = (event: KeyboardEvent<HTMLInputElement>) => {
    syncSelection(event.currentTarget);
  };

  const handleSelect = (event: SyntheticEvent<HTMLInputElement>) => {
    syncSelection(event.currentTarget);
  };

  return (
    <div className="flex items-center gap-1">
      <PromptPrefix />
      <div className="relative min-w-0 flex-1">
        <input
          ref={handleInputRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          onSelect={handleSelect}
          autoFocus
          aria-label={TERMINAL_INPUT_LABEL}
          className="min-w-0 w-full bg-transparent caret-transparent text-terminal-text outline-none"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 flex items-center whitespace-pre"
        >
          <span className="invisible">{beforeCaret}</span>
          {hasSelection ? null : (
            <span
              data-testid="prompt-caret"
              className="inline-block min-w-[1ch] animate-terminal-blink bg-white align-middle text-terminal-background"
            >
              {caretCharacter}
            </span>
          )}
        </span>
      </div>
    </div>
  );
};

export default Prompt;
