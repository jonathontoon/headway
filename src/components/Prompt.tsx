import { forwardRef, type ChangeEvent, type KeyboardEvent } from "react";

interface Props {
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
}

const Prompt = forwardRef<HTMLInputElement, Props>(
  ({ value, onChange, onKeyDown }, ref) => (
    <div className="flex items-center gap-2">
      <span className="select-none text-sky-400">
        <span className="text-white">~</span>$
      </span>
      <input
        ref={ref}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        className="flex-1 bg-transparent outline-none text-white caret-white"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
      />
    </div>
  )
);

Prompt.displayName = "Prompt";

export default Prompt;
