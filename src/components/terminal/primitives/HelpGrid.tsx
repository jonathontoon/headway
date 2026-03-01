import type { HelpGridProps } from "../../../types";
import CommandSyntax from "./CommandSyntax";
import Grid from "./Grid";

const HelpGrid = ({ rows }: HelpGridProps) => {
  const gridRows = rows.map((row) => ({
    label: <CommandSyntax syntax={row.syntax} />,
    value: <span className="text-terminal-muted">{row.description}</span>,
  }));

  return <Grid rows={gridRows} />;
};

export default HelpGrid;
