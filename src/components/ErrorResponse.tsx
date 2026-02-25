import type { ErrorResponse as ErrorResponseType } from "@types";

interface Props {
  response: ErrorResponseType;
}

const ErrorResponse = ({ response }: Props) => (
  <div className="text-red-400">{response.text}</div>
);

export default ErrorResponse;
