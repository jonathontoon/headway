import type { TerminalEntry as TerminalEntryModel } from "../store/terminal/types";
import { TerminalEntry } from "./TerminalEntry";

type TerminalHistoryProps = {
  readonly entries: readonly TerminalEntryModel[];
};

export function TerminalHistory({ entries }: TerminalHistoryProps) {
  return (
    <>
      {entries.map((entry) => (
        <TerminalEntry
          key={entry.id}
          command={entry.command}
          output={entry.output}
        />
      ))}
    </>
  );
}
