import type { FunctionComponent } from 'react';

import Status, { type StatusType } from '@components/Status';
import Hint from '@components/Hint';
import Response from '@components/Response';

interface StatusResponseProps {
  statusType: StatusType;
  statusText: string;
  hintText?: string;
}

const StatusResponse: FunctionComponent<StatusResponseProps> = ({
  statusType,
  statusText,
  hintText,
}) => (
  <Response>
    <Status current={statusType}>{statusText}</Status>
    {hintText && <Hint>{hintText}</Hint>}
  </Response>
);

export default StatusResponse;
