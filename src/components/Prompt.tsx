import {
  type KeyboardEvent,
  type ChangeEvent,
  forwardRef,
  useRef,
  useState,
  useCallback,
  useEffect,
  useImperativeHandle,
  memo,
} from "react";

import { Response } from "./index";

interface PromptProps {
  value?: string;
  disabled?: boolean;
  placeholder?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
}

const Prompt = memo(
  forwardRef<HTMLInputElement, PromptProps>(
    (
      { value = "", disabled = false, placeholder, onChange, onKeyDown },
      ref
    ) => {
      const inputRef = useRef<HTMLInputElement>(null);
      const [cursorPos, setCursorPos] = useState(0);
      const [isFocused, setIsFocused] = useState(false);
      const [textTranslateX, setTextTranslateX] = useState(0);

      useImperativeHandle(ref, () => inputRef.current!);

      const updateCursor = useCallback(() => {
        requestAnimationFrame(() => {
          const input = inputRef.current;
          if (!input) return;
          setCursorPos(input.selectionStart ?? 0);
          setTextTranslateX(-(input.scrollLeft ?? 0));
        });
      }, []);

      useEffect(() => {
        updateCursor();
      }, [value, updateCursor]);

      const handleKeyDown = useCallback(
        (event: KeyboardEvent<HTMLInputElement>) => {
          onKeyDown?.(event);
          updateCursor();
        },
        [onKeyDown, updateCursor]
      );

      const beforeCursor = value.slice(0, cursorPos);
      const cursorChar = value[cursorPos] ?? " ";
      const afterCursor = value.slice(cursorPos + 1);

      return (
        <Response className="flex items-center">
          <span className="text-sky-400">~</span>
          <span className="text-zinc-50">$</span>
          <div className="relative ml-2 flex-1 overflow-hidden">
            {/* Invisible input — captures all keyboard events and defines container height */}
            <input
              className="w-full border-none bg-transparent text-transparent caret-transparent outline-none"
              ref={inputRef}
              value={value}
              disabled={disabled}
              onChange={onChange}
              onKeyDown={handleKeyDown}
              onKeyUp={updateCursor}
              onSelect={updateCursor}
              onClick={updateCursor}
              onInput={updateCursor}
              onFocus={() => {
                setIsFocused(true);
                updateCursor();
              }}
              onBlur={() => setIsFocused(false)}
              autoComplete="off"
              autoCapitalize="none"
              data-1p-ignore="true"
              data-lpignore="true"
              data-protonpass-ignore="true"
              data-bwignore="true"
            />
            {/* Visual text overlay */}
            <div
              className="pointer-events-none absolute inset-0 flex items-center whitespace-pre text-zinc-50"
              style={{ transform: `translateX(${textTranslateX}px)` }}
            >
              <span>{beforeCursor}</span>
              <span
                className={
                  isFocused
                    ? "bg-zinc-50 text-zinc-900 animate-[terminal-blink_1s_step-end_infinite]"
                    : ""
                }
              >
                {cursorChar}
              </span>
              <span>{afterCursor}</span>
            </div>
            {/* Placeholder */}
            {value === "" && placeholder && !isFocused && (
              <span className="pointer-events-none absolute inset-0 flex items-center text-zinc-600">
                {placeholder}
              </span>
            )}
          </div>
        </Response>
      );
    }
  )
);

Prompt.displayName = "Prompt";

export default Prompt;
