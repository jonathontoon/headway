import type { TerminalGridProps } from "../../../types";

const TerminalGrid = ({ rows }: TerminalGridProps) => (
  <ul className="space-y-2">
    {rows.map((row, index) => (
      <li
        key={index}
        className="grid grid-cols-1 gap-y-1 sm:grid-cols-[1fr_2fr] sm:gap-4"
      >
        {row.label}
        {row.value}
      </li>
    ))}
  </ul>
);

export default TerminalGrid;
