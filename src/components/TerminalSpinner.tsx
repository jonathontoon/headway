type TerminalSpinnerProps = {
  readonly line: string;
};

export function TerminalSpinner({ line }: TerminalSpinnerProps) {
  return (
    <div className="block whitespace-pre-wrap text-role-muted">{` ${line}`}</div>
  );
}
