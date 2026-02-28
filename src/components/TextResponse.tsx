import type { TextResponse as TextResponseType } from "@types";
import Response from "./Response";

interface Props {
  response: TextResponseType;
}

const TextResponse = ({ response }: Props) => (
  <Response className="text-terminal-text">{response.text}</Response>
);

export default TextResponse;
