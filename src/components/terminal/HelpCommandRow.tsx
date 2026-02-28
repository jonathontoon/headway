import type { HelpCommand } from "@reducers/terminal/terminalTypes";

const PLACEHOLDER_COLORS: Record<string, string> = {
  title: "text-terminal-prioB",
  "id-or-index": "text-terminal-prioF",
  bucket: "text-terminal-prioH",
  "a|b|c|none": "text-terminal-prioK",
  "yyyy-mm-dd|none": "text-terminal-warning",
};

const renderName = (name: string) => {
  const parts = name.split(/(<[^>]+>)/);
  return parts.map((part, index) => {
    const inner = part.match(/^<([^>]+)>$/)?.[1]?.toLowerCase();
    const className = inner ? PLACEHOLDER_COLORS[inner] : undefined;

    return className ? (
      <span key={index} className={className}>
        {part}
      </span>
    ) : (
      part
    );
  });
};

const HelpCommandRow = ({ name, description }: HelpCommand) => (
  <div className="flex flex-col gap-1 md:flex-row md:gap-4">
    <dt className="m-0 text-terminal-text md:w-90 md:shrink-0">
      {renderName(name)}
    </dt>
    <dd className="m-0 text-terminal-muted">{description}</dd>
  </div>
);

export default HelpCommandRow;
