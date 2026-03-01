import type { TerminalTextProps } from "../../../types";

const TerminalText = ({ text }: TerminalTextProps) => (
  <div className="wrap-break-word whitespace-pre-wrap text-terminal-text">
    {text}
  </div>
);

export default TerminalText;
