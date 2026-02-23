import type { FunctionComponent } from "react";

import Status, { type StatusType } from "@molecules/Status.tsx";
import Hint from "@molecules/Hint.tsx";
import Response from "@molecules/Response.tsx";

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
