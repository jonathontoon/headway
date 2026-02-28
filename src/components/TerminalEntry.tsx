import { memo } from "react";
import {
  ResponseType,
  type HistoryEntry as HistoryEntryType,
  type ResponseItem,
} from "@types";

import Prompt from "@components/Prompt";
import TextResponse from "@components/TextResponse";
import StatusResponse from "@components/StatusResponse";
import TodoResponse from "@components/TodoResponse";
import BucketedTodoResponse from "@components/BucketedTodoResponse";
import HelpResponse from "@components/HelpResponse";

interface Props {
  entry: HistoryEntryType;
}

const renderResponse = (response: ResponseItem, i: number) => {
  switch (response.type) {
    case ResponseType.Text:
      return <TextResponse key={i} response={response} />;
    case ResponseType.Error:
    case ResponseType.Success:
    case ResponseType.Warning:
      return <StatusResponse key={i} response={response} />;
    case ResponseType.Todo:
      return <TodoResponse key={i} response={response} />;
    case ResponseType.BucketedTodo:
      return <BucketedTodoResponse key={i} response={response} />;
    case ResponseType.Help:
      return <HelpResponse key={i} response={response} />;
  }
};

const TerminalEntry = memo(({ entry }: Props) => (
  <div className="flex flex-col gap-4">
    {entry.command && <Prompt readOnly value={entry.command} />}
    {entry.responses.map((response, i) => renderResponse(response, i))}
  </div>
));

TerminalEntry.displayName = "TerminalEntry";

export default TerminalEntry;
