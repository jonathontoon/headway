import type { TerminalHelpGridProps } from "../../../types";
import TerminalCommandSignature from "./TerminalCommandSignature";
import TerminalGrid from "./TerminalGrid";

const TerminalHelpGrid = ({ rows }: TerminalHelpGridProps) => {
  const gridRows = rows.map((row) => ({
    label: <TerminalCommandSignature signature={row.signature} />,
    value: <span className="text-terminal-muted">{row.description}</span>,
  }));

  return <TerminalGrid rows={gridRows} />;
};

export default TerminalHelpGrid;
