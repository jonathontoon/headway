import Response from "@components/ui/Response";

interface Props {
  text: string;
}

const TextResponse = ({ text }: Props) => (
  <Response className="text-terminal-text">{text}</Response>
);

export default TextResponse;
