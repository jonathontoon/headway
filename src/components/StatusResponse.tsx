import type {
  ErrorResponse,
  WarningResponse,
  SuccessResponse,
} from "@types";
import Response from "./Response";

type StatusType = ErrorResponse | WarningResponse | SuccessResponse;

interface Props {
  response: StatusType;
}

const StatusResponse = ({ response }: Props) => {
  const getStatusConfig = (type: string) => {
    switch (type) {
      case "error":
        return {
          className: "flex gap-2 text-terminal-error",
          icon: "✗",
          textClassName: "",
        };
      case "warning":
        return {
          className: "flex gap-2 text-terminal-warning",
          icon: "~",
          textClassName: "",
        };
      case "success":
        return {
          className: "flex gap-2 text-terminal-success",
          icon: "✓",
          textClassName: "text-white",
        };
      default:
        return {
          className: "flex gap-2",
          icon: "",
          textClassName: "",
        };
    }
  };

  const config = getStatusConfig(response.type);

  return (
    <Response className={config.className}>
      <span className="select-none shrink-0" aria-hidden>
        [{config.icon}]
      </span>
      <span className={config.textClassName}>{response.text}</span>
    </Response>
  );
};

export default StatusResponse;
