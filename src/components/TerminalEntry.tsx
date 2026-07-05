import { formatOutput, formatPromptSymbol } from "../services/terminalFormat";
import { TERMINAL_PROMPT } from "../constants";

type TerminalEntryProps = {
  readonly command?: string;
  readonly output?: string;
};

export function TerminalEntry({ command, output }: TerminalEntryProps) {
  return (
    <div className="terminal-entry">
      {command !== undefined && (
        <p className="terminal-line">
          <span className="prompt">{formatPromptSymbol(TERMINAL_PROMPT)}</span>
          <span className="command"> {command}</span>
        </p>
      )}
      {output !== undefined && (
        <div className="terminal-output">{formatOutput(output)}</div>
      )}
    </div>
  );
}
