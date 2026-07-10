import { memo } from "react";
import type { TerminalEntry as TerminalEntryModel } from "../store/terminal/types";
import { TerminalEntry } from "./TerminalEntry";

type TerminalHistoryProps = {
  readonly entries: readonly TerminalEntryModel[];
  readonly taskCount: number;
};

export const TerminalHistory = memo(function TerminalHistory({
  entries,
  taskCount,
}: TerminalHistoryProps) {
  return (
    <>
      {entries.map((entry) => (
        <TerminalEntry
          key={entry.id}
          command={entry.command}
          output={entry.output}
          taskCount={taskCount}
        />
      ))}
    </>
  );
});
