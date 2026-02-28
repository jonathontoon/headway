import {
  type ChangeEvent,
  type KeyboardEvent,
  type Ref,
} from "react";

type InteractiveProps = {
  readOnly?: false;
  ref?: Ref<HTMLInputElement>;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
};

type ReadOnlyProps = {
  readOnly: true;
  value: string;
};

type Props = InteractiveProps | ReadOnlyProps;

const PromptPrefix = () => (
  <span aria-hidden="true" className="select-none text-terminal-prompt">
    <span className="text-terminal-muted">~</span>$
  </span>
);

const Prompt = (props: Props) => {
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
        aria-label="Terminal command"
        className="min-w-0 flex-1 bg-transparent text-terminal-text outline-none"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
      />
    </div>
  );
};

export default Prompt;
