import { memo } from "react";
import type { HistoryEntry as HistoryEntryType } from "@types";
import TerminalEntry from "@components/TerminalEntry";

interface Props {
  history: HistoryEntryType[];
}

const TerminalHistory = memo(({ history }: Props) => (
  <div className="flex flex-col gap-4">
    {history.map((entry) => (
      <TerminalEntry key={entry.id} entry={entry} />
    ))}
  </div>
));

TerminalHistory.displayName = "TerminalHistory";

export default TerminalHistory;
