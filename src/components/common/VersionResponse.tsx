import type { FunctionComponent } from 'react'
import Response from '../common/Response.tsx'
import Paragraph from '../base/Paragraph.tsx'

import Package from '../../../package.json'

const VersionResponse: FunctionComponent = () => (
  <Response>
    <Paragraph>v{Package.version}</Paragraph>
  </Response>
)

export default VersionResponse
