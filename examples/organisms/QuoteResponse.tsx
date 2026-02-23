import type { FunctionComponent } from "react";

import BlockQuote from "@atoms/BlockQuote.tsx";
import Response from "@molecules/Response.tsx";
import Paragraph from "@atoms/Paragraph";

interface QuoteResponseProps {
  quoteText: string;
}

const QuoteResponse: FunctionComponent<QuoteResponseProps> = ({
  quoteText
}) => {
  return (
    <Response>
      <BlockQuote>
        <Paragraph>{quoteText}</Paragraph>
      </BlockQuote>
    </Response>
  );
};

export default QuoteResponse;
