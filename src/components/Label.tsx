import type { FunctionComponent, PropsWithChildren } from "react";

interface LabelProps {
  className?: string;
}

const Label: FunctionComponent<PropsWithChildren<LabelProps>> = ({
  className = "",
  children,
}) => <p className={`text-gray-400 ${className}`.trim()}>{children}</p>;

export default Label;
