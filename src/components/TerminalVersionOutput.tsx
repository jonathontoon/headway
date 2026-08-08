type TerminalVersionOutputProps = {
  readonly version: string;
  readonly deployedAt: string;
};

/**
 * Renders version information and the last deployment time.
 *
 * @param props - Version string and deployment timestamp.
 * @returns The formatted version output.
 */
export const TerminalVersionOutput = ({
  version,
  deployedAt,
}: TerminalVersionOutputProps) => {
  return (
    <div className="block whitespace-pre-wrap">
      <div>
        <span className="text-role-command">headway</span>{" "}
        <span className="text-role-accent">v{version}</span>
      </div>
      <div className="pl-[3ch] text-role-muted">
        ↳ Last deployed {deployedAt}
      </div>
    </div>
  );
};
