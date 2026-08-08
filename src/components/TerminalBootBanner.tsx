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
  const maybeVersion = rest.at(-1);
  const hasVersion = maybeVersion !== undefined && /^v\d/.test(maybeVersion);
  const titleWords = hasVersion ? rest.slice(0, -1) : rest;
  const title = titleWords.join(" ");

  return (
    <div className="block whitespace-pre-wrap">
      <span className="text-role-command">{arrow}</span> {title}
      {hasVersion ? (
        <span className="text-role-accent"> {maybeVersion}</span>
      ) : null}
    </div>
  );
};
