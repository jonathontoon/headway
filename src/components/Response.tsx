import type { FunctionComponent, PropsWithChildren } from "react";

interface ResponseProps {
  className?: string;
}

const Response: FunctionComponent<PropsWithChildren<ResponseProps>> = ({
  className = "",
  children,
}) => <div className={`text-[15px] leading-normal tracking-tight text-white py-2 ${className}`}>{children}</div>;

export default Response;
