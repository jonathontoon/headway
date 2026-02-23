import type { FunctionComponent } from 'react';
import Response from '@molecules/Response.tsx';
import Paragraph from '@atoms/Paragraph.tsx';

import Package from '../../../package.json';

const VersionResponse: FunctionComponent = () => (
  <Response>
    <Paragraph>v{Package.version}</Paragraph>
  </Response>
);

export default VersionResponse;
