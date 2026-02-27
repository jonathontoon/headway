import type { HelpCommand } from "@types";

const PLACEHOLDER_COLORS: Record<string, string> = {
  text: "text-terminal-prioB",
  number: "text-terminal-prioF",
};

const renderName = (name: string) => {
  const parts = name.split(/(<[^>]+>|\[[^\]]+\])/);
  return parts.map((part, i) => {
    const inner = part.match(/^[<[]([^\]>]+)[>\]]$/)?.[1]?.toLowerCase();
    const color = inner ? (PLACEHOLDER_COLORS[inner] ?? "text-terminal-prioK") : undefined;
    return color ? (
      <span key={i} className={color}>{part}</span>
    ) : (
      part
    );
  });
};

const HelpCommandRow = ({ name, description }: HelpCommand) => (
  <div className="flex flex-col gap-1 mb-2 md:mb-0 md:gap-4 md:flex-row">
    <span className="text-terminal-text md:w-64 md:shrink-0">{renderName(name)}</span>
    <span className="text-zinc-600">{description}</span>
  </div>
);

export default HelpCommandRow;
