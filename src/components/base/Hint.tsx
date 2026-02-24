import type { FunctionComponent, PropsWithChildren } from "react";

interface HintProps {
  className?: string;
}

const Hint: FunctionComponent<PropsWithChildren<HintProps>> = ({
  className,
  children,
}) => <p className={`text-zinc-500 ${className}`}>{children}</p>;

export default Hint;
