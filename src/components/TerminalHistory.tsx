import { memo } from "react";
import type { HistoryEntry as HistoryEntryType } from "@types";
import HistoryEntry from "@components/HistoryEntry";

interface Props {
  history: HistoryEntryType[];
}

/**
 * Isolates the history list rendering to prevent unnecessary re-renders
 * during input keystrokes in the parent Terminal component.
 */
const TerminalHistory = memo(({ history }: Props) => (
  <>
    {history.map((entry) => (
      <HistoryEntry key={entry.id} entry={entry} />
    ))}
  </>
));

TerminalHistory.displayName = "TerminalHistory";

export default TerminalHistory;
