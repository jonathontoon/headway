import { memo } from "react";
import { TERMINAL_OUTPUT_LABEL } from "../../constants";
import type { TerminalHistoryProps } from "../../types";
import TerminalLine from "./TerminalLine";

const TerminalHistory = memo(({ items }: TerminalHistoryProps) => (
  <div
    role="log"
    aria-label={TERMINAL_OUTPUT_LABEL}
    aria-live="polite"
    aria-relevant="additions text"
    className="flex flex-col gap-4"
  >
    {items.map((item) => (
      <TerminalLine key={item.id} item={item} />
    ))}
  </div>
));

TerminalHistory.displayName = "TerminalHistory";

export default TerminalHistory;
