import type { FunctionComponent } from 'react'

import Status, { type StatusType } from '../common/Status.tsx'
import Hint from '../common/Hint.tsx'
import Response from '../common/Response.tsx'

interface StatusResponseProps {
  statusType: StatusType
  statusText: string
  hintText?: string
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
)

export default StatusResponse
