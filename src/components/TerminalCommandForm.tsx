import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { formatPromptSymbol } from "../services/terminalFormat";
import {
  TERMINAL_PROMPT,
  KEYBOARD_KEYS,
  COMMAND_VERBS,
  SUBCOMMAND_VERBS,
} from "../constants";

type TerminalCommandFormProps = {
  readonly command: string;
  readonly onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  readonly onChange: (command: string) => void;
  readonly onNavigateHistory: (direction: "previous" | "next") => void;
  readonly onCancel: () => void;
  readonly onClearScreen: () => void;
};

function completeCommand(command: string): string | null {
  if (command.length === 0) {
    return null;
  }

  const words = command.split(" ");

  if (words.length === 1) {
    const matches = COMMAND_VERBS.filter((verb) => verb.startsWith(words[0]));
    if (matches.length !== 1) {
      return null;
    }
    return `${matches[0]} `;
  }

  if (words.length === 2 && words[1].length > 0) {
    const candidates = SUBCOMMAND_VERBS[words[0]];
    if (!candidates) {
      return null;
    }

    const matches = candidates.filter((verb) => verb.startsWith(words[1]));
    if (matches.length !== 1) {
      return null;
    }

    return `${words[0]} ${matches[0]} `;
  }

  return null;
}

const CURSOR_BLINK_RESUME_DELAY_MS = 500;

export function TerminalCommandForm({
  command,
  onSubmit,
  onChange,
  onNavigateHistory,
  onCancel,
  onClearScreen,
}: TerminalCommandFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const commandTextRef = useRef<HTMLSpanElement>(null);
  const commandMeasurementRef = useRef<HTMLSpanElement>(null);
  const [cursorPosition, setCursorPosition] = useState(command.length);
  const [isCursorBlinking, setIsCursorBlinking] = useState(true);
  const resumeBlinkTimeoutRef =
    useRef<ReturnType<typeof setTimeout>>(undefined);
  const isInitialRenderRef = useRef(true);

  function pauseCursorBlink() {
    setIsCursorBlinking(false);
    clearTimeout(resumeBlinkTimeoutRef.current);
    resumeBlinkTimeoutRef.current = setTimeout(() => {
      setIsCursorBlinking(true);
    }, CURSOR_BLINK_RESUME_DELAY_MS);
  }

  function resumeCursorBlinkImmediately() {
    clearTimeout(resumeBlinkTimeoutRef.current);
    setIsCursorBlinking(true);
  }

  useEffect(() => {
    return () => clearTimeout(resumeBlinkTimeoutRef.current);
  }, []);

  function syncCursorPosition() {
    setCursorPosition(inputRef.current?.selectionStart ?? 0);
    pauseCursorBlink();
  }

  function setCursorPositionFromClientX(clientX: number) {
    const input = inputRef.current;
    const commandText = commandTextRef.current;
    const commandMeasurement = commandMeasurementRef.current;
    if (!input || !commandText || !commandMeasurement) {
      return;
    }

    const textRect = commandText.getBoundingClientRect();
    const measurementRect = commandMeasurement.getBoundingClientRect();
    const measuredLength = Math.max(command.length, 1);
    const charWidth = measurementRect.width / measuredLength;
    const nextCursorPosition =
      charWidth > 0
        ? Math.max(
            0,
            Math.min(
              command.length,
              Math.round((clientX - textRect.left) / charWidth),
            ),
          )
        : command.length;

    input.focus({ preventScroll: true });
    input.setSelectionRange(nextCursorPosition, nextCursorPosition);
    setCursorPosition(nextCursorPosition);
    pauseCursorBlink();
  }

  useLayoutEffect(() => {
    setCursorPosition(inputRef.current?.selectionStart ?? 0);

    if (isInitialRenderRef.current) {
      isInitialRenderRef.current = false;
      return;
    }

    if (command === "") {
      resumeCursorBlinkImmediately();
    } else {
      pauseCursorBlink();
    }
  }, [command]);

  useEffect(() => {
    function focusInputForTyping(event: globalThis.KeyboardEvent) {
      const input = inputRef.current;
      if (!input || document.activeElement === input) {
        return;
      }

      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      if (event.key.length !== 1 && event.key !== "Backspace") {
        return;
      }

      input.focus();
    }

    window.addEventListener("keydown", focusInputForTyping);
    return () => window.removeEventListener("keydown", focusInputForTyping);
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    requestAnimationFrame(syncCursorPosition);

    if (event.key === KEYBOARD_KEYS.arrowUp) {
      event.preventDefault();
      onNavigateHistory("previous");
      return;
    }

    if (event.key === KEYBOARD_KEYS.arrowDown) {
      event.preventDefault();
      onNavigateHistory("next");
      return;
    }

    if (event.key === KEYBOARD_KEYS.tab) {
      event.preventDefault();
      const completed = completeCommand(command);
      if (completed !== null) {
        onChange(completed);
      }
      return;
    }

    if (event.ctrlKey && event.key === "c") {
      const hasSelection = Boolean(window.getSelection()?.toString());
      if (hasSelection) {
        return;
      }
      event.preventDefault();
      onCancel();
      return;
    }

    if (event.ctrlKey && event.key === "l") {
      event.preventDefault();
      onClearScreen();
    }
  }

  function handleCommandPointerDown(event: PointerEvent<HTMLSpanElement>) {
    event.preventDefault();
    setCursorPositionFromClientX(event.clientX);
  }

  const before = command.slice(0, cursorPosition);
  const charUnderCursor = command[cursorPosition] ?? " ";
  const after = command.slice(cursorPosition + 1);

  return (
    <form
      className="m-0 text-terminal-foreground whitespace-pre-wrap font-mono text-xs sm:text-sm md:text-base leading-[1.9] flex items-baseline"
      onSubmit={onSubmit}
    >
      <label
        data-testid="prompt"
        className="text-terminal-foreground"
        htmlFor="terminal-command"
      >
        {formatPromptSymbol(TERMINAL_PROMPT)}
      </label>
      <div className="relative flex-1 min-w-[8ch] ml-[1ch]">
        {/*
          iOS Safari can paint a native insertion caret even when the input's
          text and caret are transparent. Keep the real control focusable for
          the keyboard, but remove it from the visible command text path.
        */}
        <input
          ref={inputRef}
          id="terminal-command"
          aria-label="Terminal command"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          autoFocus
          className="absolute top-0 left-0 h-px w-px opacity-0 overflow-hidden p-0 border-0 outline-none focus:outline-none focus-visible:outline-none [-webkit-tap-highlight-color:transparent] text-transparent caret-transparent bg-transparent font-mono text-base"
          style={{
            clip: "rect(0 0 0 0)",
            clipPath: "inset(50%)",
            WebkitTextFillColor: "transparent",
            textShadow: "none",
          }}
          value={command}
          onChange={(event) => onChange(event.currentTarget.value)}
          onKeyDown={handleKeyDown}
          onClick={syncCursorPosition}
          onSelect={syncCursorPosition}
        />
        <span
          ref={commandTextRef}
          className="relative block whitespace-pre cursor-text"
          aria-hidden="true"
          onPointerDown={handleCommandPointerDown}
        >
          {before}
          <span className="relative inline-block">
            {charUnderCursor}
            <span
              className={`absolute left-0 top-0 grid ${isCursorBlinking ? "animate-terminal-cursor-blink" : ""}`}
              aria-hidden="true"
            >
              <span className="col-start-1 row-start-1 text-terminal-foreground">
                █
              </span>
              <span className="col-start-1 row-start-1 text-terminal-background">
                {charUnderCursor}
              </span>
            </span>
          </span>
          {after}
        </span>
        <span
          ref={commandMeasurementRef}
          className="absolute left-0 top-0 invisible whitespace-pre pointer-events-none"
          aria-hidden="true"
        >
          {command || " "}
        </span>
      </div>
    </form>
  );
}
