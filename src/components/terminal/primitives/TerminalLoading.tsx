import type { TerminalLoadingProps } from "../../../types";

const TerminalLoading = ({ text }: TerminalLoadingProps) => (
  <div className="flex gap-2">
    <span
      aria-hidden="true"
      className="animate-terminal-blink text-terminal-info"
    >
      ●
    </span>
    <span className="break-words whitespace-pre-wrap text-terminal-text">
      {text}
    </span>
  </div>
);

export default TerminalLoading;
