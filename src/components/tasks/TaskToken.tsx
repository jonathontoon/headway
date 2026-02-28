interface Props {
  word: string;
  className?: string;
}

const TaskToken = ({ word, className = "" }: Props) => (
  <span className={className}>{word}</span>
);

export default TaskToken;
