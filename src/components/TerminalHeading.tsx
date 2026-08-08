type TerminalHeadingProps = {
  readonly line: string;
};

/**
 * Renders a muted terminal section heading without a message glyph.
 *
 * @param props - Heading text to render.
 * @returns The section heading row.
 */
export const TerminalHeading = ({ line }: TerminalHeadingProps) => {
  return (
    <div className="block whitespace-pre-wrap text-role-muted">{line}</div>
  );
};
