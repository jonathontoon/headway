import { formatOutput, formatPromptSymbol } from "../services/terminalFormat";
import { TERMINAL_BLOCK_GAP_MB, TERMINAL_PROMPT } from "../constants";

type TerminalEntryProps = {
  readonly command?: string;
  readonly output?: string;
  readonly taskCount: number;
};

export function TerminalEntry({
  command,
  output,
  taskCount,
}: TerminalEntryProps) {
  return (
    <div className={TERMINAL_BLOCK_GAP_MB}>
      {command !== undefined && (
        <p
          className={`m-0 ${TERMINAL_BLOCK_GAP_MB} text-terminal-foreground whitespace-pre-wrap font-mono text-xs sm:text-sm md:text-base leading-[1.9]`}
        >
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
          className="m-0 whitespace-pre-wrap font-mono text-xs sm:text-sm md:text-base leading-[1.9] text-terminal-foreground"
        >
          {formatOutput(output, taskCount)}
        </div>
      )}
    </div>
  );
}
