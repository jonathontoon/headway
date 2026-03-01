import type { LoadingProps } from "../../../types";

const Loading = ({ text }: LoadingProps) => (
  <div className="flex gap-2">
    <span
      aria-hidden="true"
      className="animate-terminal-blink text-terminal-info"
    >
      ●
    </span>
    <span className="wrap-break-word whitespace-pre-wrap text-terminal-text">
      {text}
    </span>
  </div>
);

export default Loading;
