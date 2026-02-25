import type { HelpCommand } from "@types";

const HelpCommandRow = ({ name, description }: HelpCommand) => (
  <div className="flex gap-4">
    <span className="w-32 shrink-0 text-white">{name}</span>
    <span className="text-zinc-400">{description}</span>
  </div>
);

export default HelpCommandRow;
