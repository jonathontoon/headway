import type { TerminalTextProps } from "../../../types";

const TerminalText = ({ text }: TerminalTextProps) => (
  <div className="break-words whitespace-pre-wrap text-terminal-text">
    {text}
  </div>
);

export default TerminalText;
