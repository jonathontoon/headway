import type { FunctionComponent } from "react";

import Status, { type StatusType } from "@common/Status";
import Hint from "@common/Hint";
import Response from "@common/Response";

interface StatusResponseProps {
  statusType: StatusType;
  statusText: string;
  hintText?: string;
}

const StatusResponse: FunctionComponent<StatusResponseProps> = ({
  statusType,
  statusText,
  hintText
}) => {
  return (
    <Response>
      <Status current={statusType}>{statusText}</Status>
      {hintText && <Hint>{hintText}</Hint>}
    </Response>
  );
};

export default StatusResponse;
