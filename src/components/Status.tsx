import { type FunctionComponent, type PropsWithChildren } from "react";

export type StatusType = "success" | "error" | "waiting" | "loading";

interface StatusProps {
  current: StatusType;
  className?: string;
}

const Status: FunctionComponent<PropsWithChildren<StatusProps>> = ({
  current,
  className,
  children,
}) => {
  const getStatusSymbol = (): string => {
    switch (current) {
      case "success":
        return "[√]";
      case "error":
        return "[×]";
      default:
        return "[~]";
    }
  };

  const getStatusColor = (): string => {
    switch (current) {
      case "error":
        return "text-red-500";
      case "success":
        return "text-green-500";
      default:
        return "text-amber-500";
    }
  };

  return (
    <p className={`${getStatusColor()} ${className}`}>
      {getStatusSymbol()}
      <span className="pl-2">{children}</span>
    </p>
  );
};

export default Status;
