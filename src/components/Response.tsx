import type { FunctionComponent, PropsWithChildren } from 'react';

interface ResponseProps {
  className?: string;
}

const Response: FunctionComponent<PropsWithChildren<ResponseProps>> = ({
  className = '',
  children,
}) => <div className={`py-2 ${className}`}>{children}</div>;

export default Response;
