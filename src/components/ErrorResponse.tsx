import type { ErrorResponse as ErrorResponseType } from "@types";
import Response from "./Response";

interface Props {
  response: ErrorResponseType;
}

const ErrorResponse = ({ response }: Props) => (
  <Response className="text-red-400">{response.text}</Response>
);

export default ErrorResponse;
