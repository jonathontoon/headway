import { TERMINAL_BLOCK_GAP_MB, TERMINAL_PROMPT } from "../constants";
import type { TerminalOutput } from "../store/terminal/output";
import { toTerminalOutput } from "../store/terminal/output";
import { TerminalOutputView } from "./TerminalOutputView";
import { TerminalPromptSymbol } from "./TerminalPromptSymbol";

type TerminalEntryProps = {
  readonly command?: string | undefined;
  readonly output?: TerminalOutput | string | undefined;
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
            <TerminalPromptSymbol prompt={TERMINAL_PROMPT} />
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
          <TerminalOutputView
            output={toTerminalOutput(output)}
            taskCount={taskCount}
          />
        </div>
      )}
    </div>
  );
}
