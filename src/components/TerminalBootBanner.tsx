type TerminalBootBannerProps = {
  readonly line: string;
};

export function TerminalBootBanner({ line }: TerminalBootBannerProps) {
  const words = line.split(" ");
  const [arrow, ...rest] = words;
  const version = rest.pop();

  return (
    <div className="block whitespace-pre-wrap">
      <span className="text-role-command">{arrow}</span> {rest.join(" ")}{" "}
      <span className="text-role-accent">{version}</span>
    </div>
  );
}
