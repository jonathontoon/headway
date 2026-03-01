import type { StatusProps, TerminalStatusLevel } from "../../../types";
import CommandSyntax from "./CommandSyntax";

const getStatusConfig = (level: TerminalStatusLevel) => {
  switch (level) {
    case "error":
      return {
        marker: "[×]",
        markerClassName: "text-terminal-error",
      };
    case "warning":
      return {
        marker: "[!]",
        markerClassName: "text-terminal-warning",
      };
    case "success":
      return {
        marker: "[√]",
        markerClassName: "text-terminal-success",
      };
    default: {
      const exhaustiveCheck: never = level;
      throw new Error(`Unhandled terminal status level: ${exhaustiveCheck}`);
    }
  }
};

const Status = ({
  level,
  message,
  detail,
  syntax,
}: StatusProps) => {
  const config = getStatusConfig(level);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap gap-2 wrap-break-word whitespace-pre-wrap">
        <span className={config.markerClassName}>{config.marker}</span>
        <span className="text-terminal-text">{message}</span>
        {syntax ? <CommandSyntax syntax={syntax} /> : null}
      </div>
      {detail ? (
        <p className="wrap-break-word whitespace-pre-wrap text-terminal-muted">
          {detail}
        </p>
      ) : null}
    </div>
  );
};

export default Status;
