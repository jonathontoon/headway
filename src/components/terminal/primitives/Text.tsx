import type { TextProps } from "../../../types";

const Text = ({ text }: TextProps) => (
  <div className="wrap-break-word whitespace-pre-wrap text-terminal-text">
    {text}
  </div>
);

export default Text;
