import { memo } from "react";
import type { LineProps } from "../../types";
import Prompt from "./Prompt";
import Grid from "./primitives/Grid";
import Heading from "./primitives/Heading";
import HelpGrid from "./primitives/HelpGrid";
import List from "./primitives/List";
import Loading from "./primitives/Loading";
import Status from "./primitives/Status";
import Text from "./primitives/Text";

const Line = memo(({ item }: LineProps) => {
  switch (item.kind) {
    case "command":
      return <Prompt readOnly value={item.text} />;
    case "text":
      return <Text text={item.text} />;
    case "status":
      return (
        <Status
          level={item.level}
          message={item.message}
          detail={item.detail}
          syntax={item.syntax}
        />
      );
    case "heading":
      return <Heading text={item.text} />;
    case "unordered-list":
      return <List items={item.items} variant="unordered" />;
    case "ordered-list":
      return <List items={item.items} variant="ordered" />;
    case "loading":
      return <Loading text={item.text} />;
    case "help":
      return <HelpGrid rows={item.rows} />;
    case "grid":
      return (
        <Grid
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

Line.displayName = "Line";

export default Line;
