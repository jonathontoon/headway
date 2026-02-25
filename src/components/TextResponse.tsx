import type { TextResponse as TextResponseType } from "@types";

interface Props {
  response: TextResponseType;
}

const TextResponse = ({ response }: Props) => (
  <div className="text-zinc-400">{response.text}</div>
);

export default TextResponse;
