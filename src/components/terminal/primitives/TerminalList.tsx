import type { TerminalListProps } from "../../../types";

const TerminalList = ({ items }: TerminalListProps) => (
  <ul className="m-0 flex list-none flex-col gap-1 p-0">
    {items.map((item) => (
      <li key={item} className="flex gap-2">
        <span aria-hidden="true" className="text-terminal-muted">
          •
        </span>
        <span className="break-words whitespace-pre-wrap text-terminal-text">
          {item}
        </span>
      </li>
    ))}
  </ul>
);

export default TerminalList;
