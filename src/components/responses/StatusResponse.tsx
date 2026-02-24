import type { FunctionComponent } from "react";

import { Status, Hint, Response } from "../base";
import type { StatusType } from "../base/Status";

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
