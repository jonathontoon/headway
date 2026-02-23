import type { FunctionComponent } from 'react';

import Paragraph from '@atoms/Paragraph.tsx';
import Span from '@atoms/Span.tsx';

import Response from '@molecules/Response.tsx';

interface LogoResponseProps {
  className?: string;
}

const LogoResponse: FunctionComponent<LogoResponseProps> = ({ className }) => (
  <Response className={className}>
    <Paragraph className="flex items-center gap-2">
      <Span className="text-blue-500">✦</Span>
      <Span className="text-red-500">✧</Span>
      <Span className="text-green-500">✦</Span>
    </Paragraph>
  </Response>
);

export default LogoResponse;
