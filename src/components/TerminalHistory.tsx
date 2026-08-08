import { Fragment, memo } from "react";
import type { TerminalEntry as TerminalEntryModel } from "../store/terminal/types";
import { TerminalEntry } from "./TerminalEntry";

type TerminalHistoryProps = {
  readonly entries: readonly TerminalEntryModel[];
  readonly taskCount: number;
};

/**
 * Renders all saved terminal history entries.
 *
 * @param props - Terminal entries and task count for output formatting.
 * @returns The terminal history list.
 */
export const TerminalHistory = memo(
  ({ entries, taskCount }: TerminalHistoryProps) => {
    return (
      <Fragment>
        {entries.map((entry) => (
          <TerminalEntry
            key={entry.id}
            command={entry.command}
            output={entry.output}
            taskCount={taskCount}
          />
        ))}
      </Fragment>
    );
  },
);
