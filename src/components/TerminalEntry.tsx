import { memo } from "react";
import {
  ResponseType,
  type HistoryEntry as HistoryEntryType,
  type ResponseItem,
  type TodoResponse as TodoResponseType,
} from "@types";

import Prompt from "@components/Prompt";
import TextResponse from "@components/TextResponse";
import ErrorResponse from "@components/ErrorResponse";
import SuccessResponse from "@components/SuccessResponse";
import WarningResponse from "@components/WarningResponse";
import TodoResponse from "@components/TodoResponse";
import HelpResponse from "@components/HelpResponse";
import TodoList from "@components/TodoList";

interface Props {
  entry: HistoryEntryType;
}

type TodoGroup = { type: "todo-group"; items: TodoResponseType[] };
type Grouped = ResponseItem | TodoGroup;

const groupResponses = (responses: ResponseItem[]): Grouped[] => {
  const result: Grouped[] = [];
  for (const response of responses) {
    if (response.type === ResponseType.Todo) {
      const last = result[result.length - 1];
      if (last && "type" in last && last.type === "todo-group") {
        (last as TodoGroup).items.push(response);
      } else {
        result.push({ type: "todo-group", items: [response] });
      }
    } else {
      result.push(response);
    }
  }
  return result;
};

const renderResponse = (response: ResponseItem, i: number) => {
  switch (response.type) {
    case ResponseType.Text:
      return <TextResponse key={i} response={response} />;
    case ResponseType.Error:
      return <ErrorResponse key={i} response={response} />;
    case ResponseType.Success:
      return <SuccessResponse key={i} response={response} />;
    case ResponseType.Warning:
      return <WarningResponse key={i} response={response} />;
    case ResponseType.Todo:
      return <TodoResponse key={i} response={response} />;
    case ResponseType.Help:
      return <HelpResponse key={i} response={response} />;
  }
};

const renderGrouped = (item: Grouped, i: number) => {
  if (item.type === "todo-group") {
    return <TodoList key={i} responses={item.items} />;
  }
  return renderResponse(item, i);
};

const TerminalEntry = memo(({ entry }: Props) => (
  <div className="flex flex-col gap-4">
    {entry.command && <Prompt readOnly value={entry.command} />}
    {groupResponses(entry.responses).map((item, i) => renderGrouped(item, i))}
  </div>
));

TerminalEntry.displayName = "TerminalEntry";

export default TerminalEntry;
