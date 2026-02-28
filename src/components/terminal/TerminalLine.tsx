import { memo } from "react";
import type { TerminalLineProps } from "../../types";
import Prompt from "./Prompt";
import TerminalCommandPalette from "./primitives/TerminalCommandPalette";
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
      return <TerminalStatus level={item.level} text={item.text} />;
    case "heading":
      return <TerminalHeading text={item.text} />;
    case "list":
      return <TerminalList items={item.items} />;
    case "loading":
      return <TerminalLoading text={item.text} />;
    case "palette":
      return <TerminalCommandPalette commands={item.commands} />;
    default: {
      const exhaustiveCheck: never = item;
      throw new Error(`Unhandled terminal transcript item: ${exhaustiveCheck}`);
    }
  }
});

TerminalLine.displayName = "TerminalLine";

export default TerminalLine;
