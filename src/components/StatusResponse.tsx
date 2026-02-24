import { memo, type FunctionComponent } from "react";

import Status, { type StatusType } from "./Status";
import Hint from "./Hint";
import Response from "./Response";

interface StatusResponseProps {
  statusType: StatusType;
  statusText: string;
  hintText?: string;
}

const StatusResponse: FunctionComponent<StatusResponseProps> = memo(
  ({ statusType, statusText, hintText }) => (
    <Response>
      <Status current={statusType}>{statusText}</Status>
      {hintText && <Hint>{hintText}</Hint>}
    </Response>
  )
);

export default StatusResponse;
