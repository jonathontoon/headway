import type { FunctionComponent } from 'react'
import Response from '../common/Response.tsx'
import Paragraph from '../base/Paragraph.tsx'
import Span from '../base/Span.tsx'

interface CountdownResponseProps {
  count: number
}

const CountdownResponse: FunctionComponent<CountdownResponseProps> = ({
  count,
}) => (
  <Response>
    <Paragraph>
      <Span className="text-amber-500">[~]</Span>
      <Span className="pl-2">Countdown: {count}</Span>
    </Paragraph>
  </Response>
)

export default CountdownResponse
