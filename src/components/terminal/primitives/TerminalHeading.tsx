import type { TerminalHeadingProps } from "../../../types";

const TerminalHeading = ({ text }: TerminalHeadingProps) => (
  <div>
    <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-terminal-accent">
      {text}
    </h2>
    <div className="mt-1 h-px bg-terminal-border" />
  </div>
);

export default TerminalHeading;
