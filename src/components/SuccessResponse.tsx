import type { SuccessResponse as SuccessResponseType } from "@types";
import Response from "./Response";

interface Props {
  response: SuccessResponseType;
}

const SuccessResponse = ({ response }: Props) => (
  <Response className="flex gap-2 text-green-400">
    <span className="select-none shrink-0" aria-hidden>✓</span>
    <span>{response.text}</span>
  </Response>
);

export default SuccessResponse;
