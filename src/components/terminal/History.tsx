import { memo } from "react";
import { TERMINAL_OUTPUT_LABEL } from "../../constants";
import type { HistoryProps } from "../../types";
import Line from "./Line";

const History = memo(({ items }: HistoryProps) => (
  <div
    role="log"
    aria-label={TERMINAL_OUTPUT_LABEL}
    aria-live="polite"
    aria-relevant="additions text"
    className="flex flex-col gap-4"
  >
    {items.map((item) => (
      <Line key={item.id} item={item} />
    ))}
  </div>
));

History.displayName = "History";

export default History;
