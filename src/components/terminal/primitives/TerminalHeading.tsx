import type { TerminalHeadingProps } from "../../../types";

const TerminalHeading = ({ text }: TerminalHeadingProps) => (
  <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-terminal-accent">
    {text}
  </h2>
);

export default TerminalHeading;
