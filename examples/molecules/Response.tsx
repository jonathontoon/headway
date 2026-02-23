import type { FunctionComponent, PropsWithChildren } from 'react';
import Div from '@atoms/Div.tsx';

interface ResponseProps {
  className?: string;
}

const Response: FunctionComponent<PropsWithChildren<ResponseProps>> = ({
  className = '',
  children,
}) => <Div className={className}>{children}</Div>;

export default Response;
