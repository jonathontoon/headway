import type { FunctionComponent } from 'react';

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
    <p>{responseText}</p>
    {hintText && <Hint>{hintText}</Hint>}
  </Response>
);

export default DefaultResponse;
