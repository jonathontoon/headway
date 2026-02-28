import { memo } from "react";
import type { TranscriptEntry } from "@reducers/terminal/terminalTypes";
import TerminalEntry from "@components/terminal/TerminalEntry";

interface Props {
  history: readonly TranscriptEntry[];
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
