import { memo } from "react";
import type { HistoryEntry as HistoryEntryType } from "@types";
import TerminalEntry from "@components/TerminalEntry";

interface Props {
  history: HistoryEntryType[];
}

const TerminalHistory = memo(({ history }: Props) => (
  <div
    role="log"
    aria-label="Terminal output"
    aria-live="polite"
    aria-relevant="additions text"
    className="flex flex-col gap-4"
  >
    {history.map((entry) => (
      <TerminalEntry key={entry.id} entry={entry} />
    ))}
  </div>
));

TerminalHistory.displayName = "TerminalHistory";

export default TerminalHistory;
