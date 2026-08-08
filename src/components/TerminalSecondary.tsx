type TerminalSecondaryProps = {
  readonly line: string;
};

/**
 * Renders indented secondary terminal text.
 *
 * @param props - Text line to render.
 * @returns The secondary output row.
 */
export const TerminalSecondary = ({ line }: TerminalSecondaryProps) => {
  return (
    <div className="block whitespace-pre-wrap text-role-muted pl-[3ch]">
      {line}
    </div>
  );
};
