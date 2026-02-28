interface Props {
  index: number;
}

const TaskIndex = ({ index }: Props) => (
  <span
    aria-hidden="true"
    className="w-10 text-terminal-muted select-none text-right tabular-nums shrink-0"
  >
    {index}.
  </span>
);

export default TaskIndex;
