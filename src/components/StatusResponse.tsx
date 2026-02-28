import type { ErrorResponse, WarningResponse, SuccessResponse } from "@types";
import Response from "./Response";

type StatusType = ErrorResponse | WarningResponse | SuccessResponse;

interface Props {
  response: StatusType;
}

const getStatusConfig = (type: StatusType["type"]) => {
  switch (type) {
    case "error":
      return {
        iconClassName: "text-terminal-error",
        icon: "✗",
      };
    case "warning":
      return {
        iconClassName: "text-terminal-warning",
        icon: "~",
      };
    case "success":
      return {
        iconClassName: "text-terminal-success",
        icon: "✓",
      };
    default:
      return {
        iconClassName: "text-terminal-muted",
        icon: "",
      };
  }
};

const StatusResponse = ({ response }: Props) => {
  const config = getStatusConfig(response.type);

  return (
    <Response className="flex gap-2">
      <span
        className={`select-none shrink-0 ${config.iconClassName}`}
        aria-hidden
      >
        [{config.icon}]
      </span>
      <span className="text-terminal-text">{response.text}</span>
    </Response>
  );
};

export default StatusResponse;
