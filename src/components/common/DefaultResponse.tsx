import type { FunctionComponent } from 'react';

import Paragraph from '@base/Paragraph';
import Hint from '@common/Hint';
import Response from '@common/Response';

interface DefaultResponseProps {
  responseText: string;
  hintText?: string;
}

const DefaultResponse: FunctionComponent<DefaultResponseProps> = ({
  responseText,
  hintText,
}) => (
  <Response>
    <Paragraph>{responseText}</Paragraph>
    {hintText && <Hint>{hintText}</Hint>}
  </Response>
);

export default DefaultResponse;
