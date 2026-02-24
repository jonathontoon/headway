import type { FunctionComponent } from "react";

import Hint from "./Hint";
import Response from "./Response";
import Text from "./Text";

interface DefaultResponseProps {
  responseText: string;
  hintText?: string;
}

const DefaultResponse: FunctionComponent<DefaultResponseProps> = ({
  responseText,
  hintText,
}) => (
  <Response>
    <Text>{responseText}</Text>
    {hintText && <Hint>{hintText}</Hint>}
  </Response>
);

export default DefaultResponse;
