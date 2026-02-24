import { memo, type FunctionComponent } from "react";
import StatusResponse from "./StatusResponse";
import TodoListResponse from "./TodoListResponse";
import TagListResponse from "./TagListResponse";
import HelpResponse from "./HelpResponse";
import IntroResponse from "./IntroResponse";
import LogoResponse from "./LogoResponse";
import Prompt from "./Prompt";
import type { HistoryItem } from "@types";

interface TerminalHistoryProps {
  history: HistoryItem[];
}

const TerminalHistory: FunctionComponent<TerminalHistoryProps> = memo(
  ({ history }) => (
    <>
      {history.map((item) => {
        switch (item.type) {
          case "status":
            return <StatusResponse key={item.id} {...item} />;
          case "todo":
            return <TodoListResponse key={item.id} {...item} />;
          case "tag":
            return <TagListResponse key={item.id} {...item} />;
          case "help":
            return <HelpResponse key={item.id} />;
          case "intro":
            return <IntroResponse key={item.id} />;
          case "logo":
            return <LogoResponse key={item.id} />;
          case "default":
            return (
              <StatusResponse
                key={item.id}
                statusType="error"
                statusText={`Command '${item.commandName}' not recognized.`}
                hintText={
                  item.hintText ?? "Type 'help' for available commands."
                }
              />
            );
          case "prompt":
            // History prompts are always disabled/static
            return <Prompt key={item.id} value={item.value} disabled />;
          case "clear":
            return null;
          default:
            return null;
        }
      })}
    </>
  )
);

TerminalHistory.displayName = "TerminalHistory";

export default TerminalHistory;
