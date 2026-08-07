type TerminalCursorOverlayProps = {
  readonly char: string;
  readonly isBlinking: boolean;
};

export function TerminalCursorOverlay({
  char,
  isBlinking,
}: TerminalCursorOverlayProps) {
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
}
