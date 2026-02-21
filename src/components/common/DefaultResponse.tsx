import type { FunctionComponent } from "react"

import Paragraph from "../base/Paragraph.tsx"
import Hint from "../common/Hint.tsx"
import Response from "../common/Response.tsx"

interface DefaultResponseProps {
  responseText: string
  hintText?: string
}

const IntroResponse: FunctionComponent<DefaultResponseProps> = ({
  responseText,
  hintText,
}) => {
  return (
    <Response>
      <Paragraph>{responseText}</Paragraph>
      {hintText && <Hint>{hintText}</Hint>}
    </Response>
  )
}

export default IntroResponse
