import type { FunctionComponent, PropsWithChildren } from "react";

interface HintProps {
  className?: string;
}

const Hint: FunctionComponent<PropsWithChildren<HintProps>> = ({
  className = "",
  children,
}) => <p className={`text-gray-500 ${className}`.trim()}>{children}</p>;

export default Hint;
