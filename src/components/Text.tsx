import { type FunctionComponent, type PropsWithChildren } from "react";

interface TextProps {
  className?: string;
}

const Text: FunctionComponent<PropsWithChildren<TextProps>> = ({
  className = "",
  children,
}) => <p className={className || undefined}>{children}</p>;

export default Text;
