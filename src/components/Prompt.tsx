import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";

type InteractiveProps = {
  readOnly?: false;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
};

type ReadOnlyProps = {
  readOnly: true;
  value: string;
};

type Props = InteractiveProps | ReadOnlyProps;

const PromptPrefix = () => (
  <span aria-hidden="true" className="select-none text-terminal-prompt">
    <span className="text-terminal-muted">~</span>$
  </span>
);

const Prompt = forwardRef<HTMLInputElement, Props>((props, forwardedRef) => {
  const { value, readOnly } = props;

  if (readOnly) {
    return (
      <div className="flex items-center gap-2">
        <PromptPrefix />
        <span className="text-terminal-text">{value}</span>
      </div>
    );
  }

  return <InteractivePrompt {...props} forwardedRef={forwardedRef} />;
});

Prompt.displayName = "Prompt";

export default Prompt;

// Extracted so hooks are only called in the interactive path
const InteractivePrompt = ({
  value,
  onChange,
  onKeyDown,
  forwardedRef,
}: Omit<InteractiveProps, "readOnly"> & {
  forwardedRef: React.ForwardedRef<HTMLInputElement>;
}) => {
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
      <PromptPrefix />
      <div className="relative flex-1">
        {/* Visible overlay — sets height, renders block cursor */}
        <div
          aria-hidden
          className="pointer-events-none select-none whitespace-pre"
        >
          {textBefore}
          <span className="animate-terminal-blink bg-terminal-text text-terminal-background">
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
          aria-label="Terminal command"
          className="absolute inset-0 w-full bg-transparent text-transparent caret-transparent outline-none"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
      </div>
    </div>
  );
};
