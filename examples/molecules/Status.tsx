import {
  useCallback,
  type FunctionComponent,
  type PropsWithChildren,
} from 'react';

import Paragraph from '@atoms/Paragraph.tsx';
import Span from '@atoms/Span.tsx';

export type StatusType = 'success' | 'error' | 'waiting' | 'loading';

interface StatusProps {
  current: StatusType;
  className?: string;
}

const Status: FunctionComponent<PropsWithChildren<StatusProps>> = ({
  current,
  className,
  children,
}) => {
  const getStatusSymbol = useCallback((): string => {
    switch (current) {
      case 'success':
        return '[√]';
      case 'error':
        return '[×]';
      default:
        return '[~]';
    }
  }, [current]);

  const getStatusColor = useCallback((): string => {
    switch (current) {
      case 'error':
        return 'text-red-500';
      case 'success':
        return 'text-green-500';
      default:
        return 'text-amber-500';
    }
  }, [current]);

  return (
    <Paragraph className={`${getStatusColor()} ${className}`}>
      {getStatusSymbol()}
      <Span className="pl-2">{children}</Span>
    </Paragraph>
  );
};

export default Status;
