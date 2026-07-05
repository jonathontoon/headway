import { formatOutput, formatPromptSymbol } from "../services/terminalFormat";
import { TERMINAL_PROMPT } from "../constants";

type TerminalEntryProps = {
  readonly command?: string;
  readonly output?: string;
};

export function TerminalEntry({ command, output }: TerminalEntryProps) {
  return (
    <div className="mb-2">
      {command !== undefined && (
        <p className="m-0 text-terminal-foreground whitespace-pre-wrap font-mono text-[13px] leading-[1.9]">
          <span data-testid="prompt" className="text-terminal-foreground">
            {formatPromptSymbol(TERMINAL_PROMPT)}
          </span>
          <span data-testid="command" className="text-terminal-foreground">
            {" "}
            {command}
          </span>
        </p>
      )}
      {output !== undefined && (
        <div
          data-testid="terminal-output"
          className="m-0 whitespace-pre-wrap font-mono text-[13px] leading-[1.9] text-terminal-foreground"
        >
          {formatOutput(output)}
        </div>
      )}
    </div>
  );
}
