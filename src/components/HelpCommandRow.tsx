import type { HelpCommand } from "@types";

const PLACEHOLDER_COLORS: Record<string, string> = {
  text: "text-terminal-prioB",
  number: "text-terminal-prioF",
};

const renderName = (name: string) => {
  const parts = name.split(/(<[^>]+>|\[[^\]]+\])/);
  return parts.map((part, i) => {
    const inner = part.match(/^[<[]([^\]>]+)[>\]]$/)?.[1]?.toLowerCase();
    const color = inner
      ? (PLACEHOLDER_COLORS[inner] ?? "text-terminal-prioK")
      : undefined;
    return color ? (
      <span key={i} className={color}>
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
