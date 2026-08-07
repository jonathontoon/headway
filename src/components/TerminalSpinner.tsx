type TerminalSpinnerProps = {
  readonly line: string;
};

export const TerminalSpinner = ({ line }: TerminalSpinnerProps) => {
  return (
    <div className="block whitespace-pre-wrap text-role-muted">{` ${line}`}</div>
  );
};
