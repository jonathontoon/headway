import { memo } from "react";
import {
  ResponseType,
  type HistoryEntry as HistoryEntryType,
  type ResponseItem,
} from "@types";

import TextResponse from "@components/TextResponse";
import ErrorResponse from "@components/ErrorResponse";
import SuccessResponse from "@components/SuccessResponse";
import WarningResponse from "@components/WarningResponse";
import TodoResponse from "@components/TodoResponse";
import HelpResponse from "@components/HelpResponse";

interface Props {
  entry: HistoryEntryType;
}

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

const TerminalEntry = memo(({ entry }: Props) => (
  <div>
    {entry.command && (
      <div className="flex items-center gap-2 pb-4">
        <span className="select-none text-sky-400">
          <span className="text-white">~</span>$
        </span>
        <span className="text-white">{entry.command}</span>
      </div>
    )}
    {entry.responses.map(renderResponse)}
  </div>
));

TerminalEntry.displayName = "TerminalEntry";

export default TerminalEntry;
