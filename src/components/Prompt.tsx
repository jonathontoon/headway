import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";

interface Props {
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
}

const Prompt = forwardRef<HTMLInputElement, Props>(
  ({ value, onChange, onKeyDown }, forwardedRef) => {
    const [cursorPos, setCursorPos] = useState(value.length);
    const inputRef = useRef<HTMLInputElement>(null);

    const mergedRef = useCallback(
      (node: HTMLInputElement | null) => {
        (inputRef as React.RefObject<HTMLInputElement | null>).current = node;
        if (typeof forwardedRef === "function") {
          forwardedRef(node);
        } else if (forwardedRef) {
          (forwardedRef as React.RefObject<HTMLInputElement | null>).current =
            node;
        }
      },
      [forwardedRef]
    );

    useEffect(() => {
      setCursorPos(value.length);
    }, [value]);

    const syncCursor = () => {
      if (inputRef.current) {
        setCursorPos(inputRef.current.selectionStart ?? value.length);
      }
    };

    const textBefore = value.slice(0, cursorPos);
    const cursorChar = value[cursorPos] ?? " ";
    const textAfter = value.slice(cursorPos + 1);

    return (
      <div className="flex items-center gap-2">
        <span className="select-none text-sky-400">
          <span className="text-white">~</span>$
        </span>
        <div className="relative flex-1">
          {/* Visible overlay — sets height, renders block cursor */}
          <div
            aria-hidden
            className="pointer-events-none select-none whitespace-pre"
          >
            {textBefore}
            <span className="animate-terminal-blink bg-white text-black">
              {cursorChar}
            </span>
            {textAfter}
          </div>
          {/* Real input — invisible but captures all events */}
          <input
            ref={mergedRef}
            value={value}
            onChange={onChange}
            onKeyUp={syncCursor}
            onSelect={syncCursor}
            onFocus={syncCursor}
            onKeyDown={onKeyDown}
            className="absolute inset-0 w-full bg-transparent text-transparent caret-transparent outline-none"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>
      </div>
    );
  }
);

Prompt.displayName = "Prompt";

export default Prompt;
