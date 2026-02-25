interface Props {
  index: number;
}

const TodoIndex = ({ index }: Props) => (
  <span className="text-zinc-500 select-none w-6 text-right shrink-0">
    {index}.
  </span>
);

export default TodoIndex;
