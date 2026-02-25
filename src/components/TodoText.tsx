import TodoToken from "@components/TodoToken";

interface Props {
  raw: string;
}

const priorityClass = (p: string): string => {
  if (p === "A") return "text-red-400";
  if (p === "B") return "text-yellow-400";
  if (p === "C") return "text-green-400";
  return "text-purple-400";
};

const tokenize = (text: string) =>
  text.split(" ").map((word) => {
    if (/^\([A-Z]\)$/.test(word))
      return { word, className: priorityClass(word[1]) };
    if (/^\d{4}-\d{2}-\d{2}$/.test(word))
      return { word, className: "text-zinc-500" };
    if (word.startsWith("@")) return { word, className: "text-cyan-400" };
    if (word.startsWith("+")) return { word, className: "text-blue-400" };
    return { word, className: "" };
  });

const TodoText = ({ raw }: Props) => {
  const done = raw.startsWith("x ");
  const tokens = tokenize(done ? raw.slice(2) : raw);

  return (
    <span className={done ? "line-through" : ""}>
      {tokens.flatMap((token, i) => [
        <TodoToken key={i} word={token.word} className={token.className} />,
        i < tokens.length - 1 ? " " : null,
      ])}
    </span>
  );
};

export default TodoText;
