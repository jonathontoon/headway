import type { TerminalHeadingProps } from "../../../types";

const TerminalHeading = ({ text }: TerminalHeadingProps) => (
  <div className="inline-flex items-center gap-2 text-terminal-text">
    <span className="bg-terminal-info px-2 py-0.5 font-semibold text-terminal-background">
      {text}
    </span>
  </div>
);

export default TerminalHeading;
