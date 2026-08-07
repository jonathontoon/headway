type TerminalSecondaryProps = {
  readonly line: string;
};

export function TerminalSecondary({ line }: TerminalSecondaryProps) {
  return (
    <div className="block whitespace-pre-wrap text-role-muted pl-[3ch]">
      {line}
    </div>
  );
}
