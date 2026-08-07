type TerminalURLProps = {
  readonly line: string;
};

export function TerminalURL({ line }: TerminalURLProps) {
  return (
    <div className="block whitespace-pre-wrap pl-[3ch]">
      <a
        href={line}
        target="_blank"
        rel="noopener noreferrer"
        className="text-role-accent underline hover:no-underline"
      >
        {line}
      </a>
    </div>
  );
}
