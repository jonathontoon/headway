import { Fragment, memo } from "react";
import type { HistoryEntry as HistoryEntryType } from "@types";
import TerminalEntry from "@components/TerminalEntry";

interface Props {
  history: HistoryEntryType[];
}

const TerminalHistory = memo(({ history }: Props) => (
  <Fragment>
    {history.map((entry) => (
      <TerminalEntry key={entry.id} entry={entry} />
    ))}
  </Fragment>
));

TerminalHistory.displayName = "TerminalHistory";

export default TerminalHistory;
