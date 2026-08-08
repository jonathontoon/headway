import { TERMINAL_BLOCK_GAP_MB, TERMINAL_PROMPT } from "../constants";
import type { TerminalOutput } from "../store/terminal/output";
import { toTerminalOutput } from "../store/terminal/output";
import { TerminalOutputView } from "./TerminalOutputView";
import { TerminalPromptSymbol } from "./TerminalPromptSymbol";
import { TerminalResponseBlock } from "./TerminalResponseBlock";

type TerminalEntryProps = {
  readonly command?: string | undefined;
  readonly output?: TerminalOutput | string | undefined;
  readonly taskCount: number;
};

/**
 * Renders one terminal history entry, including the submitted command and its
 * response output.
 *
 * @param props - The command, output, and task count for the entry.
 * @returns The rendered terminal history entry.
 */
export const TerminalEntry = ({
  command,
  output,
  taskCount,
}: TerminalEntryProps) => {
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
        <TerminalResponseBlock>
          <TerminalOutputView
            output={toTerminalOutput(output)}
            taskCount={taskCount}
          />
        </TerminalResponseBlock>
      )}
    </div>
  );
};
