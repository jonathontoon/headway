type TerminalBootBannerProps = {
  readonly line: string;
};

/**
 * Renders the boot banner with command and version highlighting.
 *
 * @param props - Boot banner line to render.
 * @returns The formatted boot banner.
 */
export const TerminalBootBanner = ({ line }: TerminalBootBannerProps) => {
  const words = line.split(" ");
  const [arrow, ...rest] = words;
  const version = rest.pop();

  return (
    <div className="block whitespace-pre-wrap">
      <span className="text-role-command">{arrow}</span> {rest.join(" ")}{" "}
      <span className="text-role-accent">{version}</span>
    </div>
  );
};
