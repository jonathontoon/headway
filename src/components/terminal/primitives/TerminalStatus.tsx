import type {
  TerminalStatusLevel,
  TerminalStatusProps,
} from "../../../types";

const getStatusConfig = (level: TerminalStatusLevel) => {
  switch (level) {
    case "error":
      return {
        marker: "[error]",
        markerClassName: "text-terminal-error",
      };
    case "warning":
      return {
        marker: "[warn]",
        markerClassName: "text-terminal-warning",
      };
    case "success":
      return {
        marker: "[ok]",
        markerClassName: "text-terminal-success",
      };
    default: {
      const exhaustiveCheck: never = level;
      throw new Error(`Unhandled terminal status level: ${exhaustiveCheck}`);
    }
  }
};

const TerminalStatus = ({ level, text }: TerminalStatusProps) => {
  const config = getStatusConfig(level);

  return (
    <div className="flex gap-2 break-words whitespace-pre-wrap">
      <span className={config.markerClassName}>{config.marker}</span>
      <span className="text-terminal-text">{text}</span>
    </div>
  );
};

export default TerminalStatus;
