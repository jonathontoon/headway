import type { FunctionComponent } from "react";

import Paragraph from "@atoms/Paragraph.tsx";
import Hint from "@molecules/Hint.tsx";
import Response from "@molecules/Response.tsx";

interface DefaultResponseProps {
  responseText: string;
  hintText?: string;
}

const IntroResponse: FunctionComponent<DefaultResponseProps> = ({
  responseText,
  hintText
}) => {
  return (
    <Response>
      <Paragraph>{responseText}</Paragraph>
      {hintText && <Hint>{hintText}</Hint>}
    </Response>
  );
};

export default IntroResponse;
