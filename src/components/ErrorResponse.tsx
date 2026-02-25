import type { ErrorResponse as ErrorResponseType } from "@types";
import Response from "./Response";

interface Props {
  response: ErrorResponseType;
}

const ErrorResponse = ({ response }: Props) => (
  <Response className="flex gap-2 text-red-400">
    <span className="select-none shrink-0" aria-hidden>✗</span>
    <span>{response.text}</span>
  </Response>
);

export default ErrorResponse;
