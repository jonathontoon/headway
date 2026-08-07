import {
  useEffect,
  type FormEvent,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { useTerminalCursor } from "../hooks/useTerminalCursor";
import { TERMINAL_PROMPT, KEYBOARD_KEYS } from "../constants";
import { COMMAND_VERBS, SUBCOMMAND_VERBS } from "../commands/registry";
import { TerminalCursorOverlay } from "./TerminalCursorOverlay";
import { TerminalPromptSymbol } from "./TerminalPromptSymbol";

type TerminalCommandFormProps = {
  readonly command: string;
  readonly onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  readonly onChange: (command: string) => void;
  readonly onNavigateHistory: (direction: "previous" | "next") => void;
  readonly onCancel: () => void;
  readonly onClearScreen: () => void;
};

const completeCommand = (command: string): string | null => {
  if (command.length === 0) {
    return null;
  }

  const words = command.split(" ");
  const firstWord = words[0]!;

  if (words.length === 1) {
    const matches = COMMAND_VERBS.filter((verb) => verb.startsWith(firstWord));
    if (matches.length !== 1) {
      return null;
    }
    return `${matches[0]} `;
  }

  if (words.length === 2) {
    const secondWord = words[1]!;
    if (secondWord.length === 0) {
      return null;
    }

    const candidates = SUBCOMMAND_VERBS[firstWord];
    if (!candidates) {
      return null;
    }

    const matches = candidates.filter((verb) => verb.startsWith(secondWord));
    if (matches.length !== 1) {
      return null;
    }

    return `${firstWord} ${matches[0]} `;
  }

  return null;
};

export const TerminalCommandForm = ({
  command,
  onSubmit,
  onChange,
  onNavigateHistory,
  onCancel,
  onClearScreen,
}: TerminalCommandFormProps) => {
  const {
    inputRef,
    commandTextRef,
    commandMeasurementRef,
    syncCursorPosition,
    setCursorPositionFromClientX,
    before,
    charUnderCursor,
    after,
    isCursorBlinking,
  } = useTerminalCursor(command);

  useEffect(() => {
    const focusInputForTyping = (event: globalThis.KeyboardEvent) => {
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
    };

    window.addEventListener("keydown", focusInputForTyping);
    return () => window.removeEventListener("keydown", focusInputForTyping);
  }, [inputRef]);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
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
  };

  const handleCommandPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    event.preventDefault();
    setCursorPositionFromClientX(event.clientX);
  };

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
        <TerminalPromptSymbol prompt={TERMINAL_PROMPT} />
      </label>
      <div
        data-testid="terminal-command-capture"
        className="relative flex-1 min-w-[8ch] min-h-[1.9em] ml-[1ch] cursor-text touch-manipulation"
        onPointerDown={handleCommandPointerDown}
      >
        <input
          ref={inputRef}
          id="terminal-command"
          aria-label="Terminal command"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          enterKeyHint="go"
          inputMode="text"
          spellCheck={false}
          autoFocus
          className="absolute inset-0 block h-full w-full appearance-none opacity-0 overflow-hidden p-0 border-0 outline-none focus:outline-none focus-visible:outline-none [-webkit-tap-highlight-color:transparent] text-transparent caret-transparent bg-transparent font-mono text-base leading-[1.9]"
          style={{
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
          className="relative block whitespace-pre pointer-events-none"
          aria-hidden="true"
        >
          {before}
          <TerminalCursorOverlay
            char={charUnderCursor}
            isBlinking={isCursorBlinking}
          />
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
};
