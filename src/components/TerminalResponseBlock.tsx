import type { PropsWithChildren } from "react";

type TerminalResponseBlockProps = PropsWithChildren;

/**
 * Provides the shared terminal response layout without changing each output
 * brick's own content rules.
 *
 * @param props - The response content to render.
 * @returns The terminal response wrapper.
 */
export const TerminalResponseBlock = ({
  children,
}: TerminalResponseBlockProps) => {
  return (
    <div
      data-testid="terminal-output"
      className="m-0 whitespace-pre-wrap font-mono text-xs sm:text-sm md:text-base leading-[1.9] text-terminal-foreground"
    >
      {children}
    </div>
  );
};
