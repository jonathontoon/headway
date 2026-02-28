import { TERMINAL_COMMAND_PALETTE_TITLE } from "../../../constants";
import type { TerminalCommandPaletteProps } from "../../../types";

const TerminalCommandPalette = ({ commands }: TerminalCommandPaletteProps) => (
  <section className="rounded-sm border border-terminal-surface-strong bg-terminal-surface p-3">
    <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-terminal-accent">
      {TERMINAL_COMMAND_PALETTE_TITLE}
    </h2>
    <div className="flex flex-col gap-2">
      {commands.map((command) => (
        <div
          key={command.name}
          className="flex flex-col gap-1 border-b border-terminal-surface-strong pb-2 last:border-b-0 last:pb-0"
        >
          <span className="text-terminal-info">{command.name}</span>
          <span className="break-words whitespace-pre-wrap text-terminal-muted">
            {command.description}
          </span>
        </div>
      ))}
    </div>
  </section>
);

export default TerminalCommandPalette;
