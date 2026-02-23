import type { FunctionComponent, PropsWithChildren } from 'react';
import Div from '@base/Div';

interface ResponseProps {
  className?: string;
}

const Response: FunctionComponent<PropsWithChildren<ResponseProps>> = ({
  className = '',
  children,
}) => <Div className={`py-2 ${className}`}>{children}</Div>;

export default Response;
