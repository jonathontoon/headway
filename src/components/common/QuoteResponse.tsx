import type { FunctionComponent } from 'react'

import BlockQuote from '../base/BlockQuote.tsx'
import Response from '../common/Response.tsx'
import Paragraph from '../base/Paragraph'

interface QuoteResponseProps {
  quoteText: string
}

const QuoteResponse: FunctionComponent<QuoteResponseProps> = ({
  quoteText,
}) => (
  <Response>
    <BlockQuote>
      <Paragraph>{quoteText}</Paragraph>
    </BlockQuote>
  </Response>
)

export default QuoteResponse
