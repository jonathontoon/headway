type TerminalCursorOverlayProps = {
  readonly char: string;
  readonly isBlinking: boolean;
};

/**
 * Renders the block cursor over the character at the insertion point.
 *
 * @param props - Character under the cursor and blink state.
 * @returns The cursor overlay.
 */
export const TerminalCursorOverlay = ({
  char,
  isBlinking,
}: TerminalCursorOverlayProps) => {
  return (
    <span className="relative inline-block">
      {char}
      <span
        className={`absolute left-0 top-0 grid ${isBlinking ? "animate-terminal-cursor-blink" : ""}`}
        aria-hidden="true"
      >
        <span className="col-start-1 row-start-1 text-terminal-foreground">
          █
        </span>
        <span className="col-start-1 row-start-1 text-terminal-background">
          {char}
        </span>
      </span>
    </span>
  );
};
