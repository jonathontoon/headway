import type { ListProps } from "../../../types";

const List = ({ items, variant }: ListProps) => {
  const ListTag = variant === "ordered" ? "ol" : "ul";

  return (
    <ListTag className="m-0 flex list-none flex-col gap-1 p-0">
      {items.map((item, index) => (
        <li key={`${variant}-${item}-${index}`} className="flex gap-2">
          <span aria-hidden="true" className="text-terminal-muted">
            {variant === "ordered" ? `${index + 1}.` : "•"}
          </span>
          <span className="wrap-break-word whitespace-pre-wrap text-terminal-text">
            {item}
          </span>
        </li>
      ))}
    </ListTag>
  );
};

export default List;
