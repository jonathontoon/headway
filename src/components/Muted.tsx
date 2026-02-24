import { type FunctionComponent, type PropsWithChildren } from "react";

interface MutedProps {
  className?: string;
}

const Muted: FunctionComponent<PropsWithChildren<MutedProps>> = ({
  className = "",
  children,
}) => <span className={`text-gray-500 ${className}`.trim()}>{children}</span>;

export default Muted;
