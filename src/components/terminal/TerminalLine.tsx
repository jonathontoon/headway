import { memo } from "react";
import type { TerminalLineProps } from "../../types";
import Prompt from "./Prompt";
import TerminalHelpGrid from "./primitives/TerminalHelpGrid";
import TerminalGrid from "./primitives/TerminalGrid";
import TerminalHeading from "./primitives/TerminalHeading";
import TerminalList from "./primitives/TerminalList";
import TerminalLoading from "./primitives/TerminalLoading";
import TerminalStatus from "./primitives/TerminalStatus";
import TerminalText from "./primitives/TerminalText";

const TerminalLine = memo(({ item }: TerminalLineProps) => {
  switch (item.kind) {
    case "command":
      return <Prompt readOnly value={item.text} />;
    case "text":
      return <TerminalText text={item.text} />;
    case "status":
      return (
        <TerminalStatus
          level={item.level}
          message={item.message}
          detail={item.detail}
          signature={item.signature}
        />
      );
    case "heading":
      return <TerminalHeading text={item.text} />;
    case "list":
      return <TerminalList items={item.items} />;
    case "loading":
      return <TerminalLoading text={item.text} />;
    case "help":
      return <TerminalHelpGrid rows={item.rows} />;
    case "grid":
      return (
        <TerminalGrid
          rows={item.rows.map((row) => ({
            label: <span className="text-terminal-text">{row.label}</span>,
            value: <span className="text-terminal-muted">{row.value}</span>,
          }))}
        />
      );
    default: {
      const exhaustiveCheck: never = item;
      throw new Error(`Unhandled terminal transcript item: ${exhaustiveCheck}`);
    }
  }
});

TerminalLine.displayName = "TerminalLine";

export default TerminalLine;
