import type { FunctionComponent } from "react";
import Response from "@molecules/Response.tsx";
import Paragraph from "@atoms/Paragraph.tsx";
import Span from "@atoms/Span.tsx";

interface CountdownResponseProps {
  count: number;
}

const CountdownResponse: FunctionComponent<CountdownResponseProps> = ({
  count
}) => {
  return (
    <Response>
      <Paragraph>
        <Span className="text-amber-500">[~]</Span>
        <Span className="pl-2">Countdown: {count}</Span>
      </Paragraph>
    </Response>
  );
};

export default CountdownResponse;
