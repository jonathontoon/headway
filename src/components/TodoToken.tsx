interface Props {
  word: string;
  className?: string;
}

const TodoToken = ({ word, className = "" }: Props) => (
  <span className={className}>{word}</span>
);

export default TodoToken;
