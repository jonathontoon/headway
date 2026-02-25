import { memo } from "react";
import {
  ResponseType,
  type HistoryEntry as HistoryEntryType,
  type ResponseItem,
} from "@types";
import TextResponse from "@components/TextResponse";
import ErrorResponse from "@components/ErrorResponse";
import TodoResponse from "@components/TodoResponse";

interface Props {
  entry: HistoryEntryType;
}

const renderResponse = (response: ResponseItem, i: number) => {
  switch (response.type) {
    case ResponseType.Text:
      return <TextResponse key={i} response={response} />;
    case ResponseType.Error:
      return <ErrorResponse key={i} response={response} />;
    case ResponseType.Todo:
      return <TodoResponse key={i} response={response} />;
  }
};

const HistoryEntry = memo(({ entry }: Props) => (
  <div>
    {entry.command && (
      <div className="flex items-center gap-2 pb-1">
        <span className="select-none text-sky-400">
          <span className="text-white">~</span>$
        </span>
        <span className="text-white">{entry.command}</span>
      </div>
    )}
    {entry.responses.map(renderResponse)}
  </div>
));

HistoryEntry.displayName = "HistoryEntry";

export default HistoryEntry;
