type TerminalSpinnerProps = {
  readonly line: string;
};

/**
 * Renders a muted progress line.
 *
 * @param props - Spinner text to render.
 * @returns The spinner output row.
 */
export const TerminalSpinner = ({ line }: TerminalSpinnerProps) => {
  return (
    <div className="block whitespace-pre-wrap text-role-muted">{` ${line}`}</div>
  );
};
