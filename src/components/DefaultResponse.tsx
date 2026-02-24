import type { FunctionComponent } from 'react';

import Hint from '@components/Hint';
import Response from '@components/Response';

interface DefaultResponseProps {
  responseText: string;
  hintText?: string;
}

const DefaultResponse: FunctionComponent<DefaultResponseProps> = ({
  responseText,
  hintText,
}) => (
  <Response>
    <p>{responseText}</p>
    {hintText && <Hint>{hintText}</Hint>}
  </Response>
);

export default DefaultResponse;
