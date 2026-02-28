import { memo } from "react";
import type {
  TerminalEvent,
  TranscriptEntry,
} from "@reducers/terminal/terminalTypes";

import HelpResponse from "@components/terminal/HelpResponse";
import Prompt from "@components/terminal/Prompt";
import StatusResponse from "@components/terminal/StatusResponse";
import TextResponse from "@components/terminal/TextResponse";
import TaskGroupedList from "@components/tasks/TaskGroupedList";
import TaskList from "@components/tasks/TaskList";

interface Props {
  entry: TranscriptEntry;
}

const renderEvent = (event: TerminalEvent, index: number) => {
  switch (event.kind) {
    case "message":
      return event.level === "info" ? (
        <TextResponse key={index} text={event.text} />
      ) : (
        <StatusResponse key={index} level={event.level} text={event.text} />
      );
    case "taskList":
      return event.mode === "flat" ? (
        <TaskList key={index} tasks={event.items} />
      ) : (
        <TaskGroupedList key={index} tasks={event.items} />
      );
    case "help":
      return <HelpResponse key={index} sections={event.sections} />;
    default: {
      const exhaustiveCheck: never = event;
      throw new Error(`Unhandled terminal event: ${exhaustiveCheck}`);
    }
  }
};

const TerminalEntry = memo(({ entry }: Props) => (
  <div className="flex flex-col gap-4">
    {entry.command && <Prompt readOnly value={entry.command} />}
    {entry.status === "pending" ? <TextResponse text="Running..." /> : null}
    {entry.events.map((event, index) => renderEvent(event, index))}
  </div>
));

TerminalEntry.displayName = "TerminalEntry";

export default TerminalEntry;
