import type { FunctionComponent, PropsWithChildren } from 'react';
import Paragraph from '@atoms/Paragraph.tsx';

interface HintProps {
  className?: string;
}

const Hint: FunctionComponent<PropsWithChildren<HintProps>> = ({
  className,
  children,
}) => (
  <Paragraph className={`text-zinc-500 ${className}`}>{children}</Paragraph>
);

export default Hint;
