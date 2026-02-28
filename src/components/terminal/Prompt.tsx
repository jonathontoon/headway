import { TERMINAL_INPUT_LABEL } from "../../constants";
import type { PromptProps } from "../../types";

const PromptPrefix = () => (
  <span aria-hidden="true" className="select-none text-terminal-prompt">
    <span className="text-terminal-muted">~</span>$
  </span>
);

const Prompt = (props: PromptProps) => {
  const { value, readOnly } = props;

  if (readOnly) {
    return (
      <div className="flex items-center gap-2">
        <PromptPrefix />
        <span className="text-terminal-text">{value}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <PromptPrefix />
      <input
        ref={props.ref}
        value={value}
        onChange={props.onChange}
        onKeyDown={props.onKeyDown}
        aria-label={TERMINAL_INPUT_LABEL}
        className="min-w-0 flex-1 bg-transparent text-terminal-text outline-none"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
      />
    </div>
  );
};

export default Prompt;
