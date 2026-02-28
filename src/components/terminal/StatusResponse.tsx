import type { TerminalMessageLevel } from "@reducers/terminal/terminalTypes";
import Response from "@components/ui/Response";

interface Props {
  level: TerminalMessageLevel;
  text: string;
}

const getStatusConfig = (level: TerminalMessageLevel) => {
  switch (level) {
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
    case "info":
      return {
        iconClassName: "text-terminal-muted",
        icon: "•",
      };
    default: {
      const exhaustiveCheck: never = level;
      throw new Error(`Unhandled message level: ${exhaustiveCheck}`);
    }
  }
};

const StatusResponse = ({ level, text }: Props) => {
  const config = getStatusConfig(level);

  return (
    <Response className="flex gap-2">
      <span
        className={`select-none shrink-0 ${config.iconClassName}`}
        aria-hidden
      >
        [{config.icon}]
      </span>
      <span className="text-terminal-text">{text}</span>
    </Response>
  );
};

export default StatusResponse;
