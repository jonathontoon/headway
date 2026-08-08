type TerminalURLProps = {
  readonly line: string;
};

/**
 * Renders an indented terminal URL.
 *
 * @param props - URL string to render.
 * @returns The terminal link row.
 */
export const TerminalURL = ({ line }: TerminalURLProps) => {
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
};
