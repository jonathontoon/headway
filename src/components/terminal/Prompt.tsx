import { TERMINAL_INPUT_LABEL } from "../../constants";
import { usePromptSelection } from "../../hooks/usePromptSelection";
import type { InteractivePromptProps, PromptProps } from "../../types";

const PromptPrefix = () => (
  <span aria-hidden="true" className="flex items-center gap-0">
    <span className="select-none text-cyan-300">~</span>
    <span className="select-none text-white">$</span>
  </span>
);

const ReadOnlyPrompt = ({ value }: { value: string }) => (
  <div className="flex items-center gap-1">
    <PromptPrefix />
    <span className="text-terminal-text">{value}</span>
  </div>
);

const InteractivePrompt = ({
  value,
  onChange,
  onKeyDown,
  ref,
}: InteractivePromptProps) => {
  const {
    handleInputRef,
    handleKeyUp,
    handleSelect,
    beforeCaret,
    hasSelection,
    caretCharacter,
  } = usePromptSelection(value, ref);

  return (
    <div className="flex items-center gap-1">
      <PromptPrefix />
      <div className="relative min-w-0 flex-1">
        <input
          ref={handleInputRef}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onKeyUp={handleKeyUp}
          onSelect={handleSelect}
          autoFocus
          aria-label={TERMINAL_INPUT_LABEL}
          className="min-w-0 w-full bg-transparent caret-transparent text-terminal-text outline-none"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 flex items-center whitespace-pre"
        >
          <span className="invisible">{beforeCaret}</span>
          {hasSelection ? null : (
            <span
              data-testid="prompt-caret"
              className="inline-block min-w-[1ch] animate-terminal-blink bg-white align-middle text-terminal-background"
            >
              {caretCharacter}
            </span>
          )}
        </span>
      </div>
    </div>
  );
};

const Prompt = (props: PromptProps) =>
  props.readOnly ? (
    <ReadOnlyPrompt value={props.value} />
  ) : (
    <InteractivePrompt {...props} />
  );

export default Prompt;
