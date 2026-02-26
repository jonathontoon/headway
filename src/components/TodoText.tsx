import TodoToken from "@components/TodoToken";

interface Props {
  text: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  A: "text-red-400",
  B: "text-yellow-400",
  C: "text-green-400",
  D: "text-emerald-400",
  E: "text-teal-400",
  F: "text-cyan-400",
  G: "text-sky-400",
  H: "text-blue-400",
  I: "text-indigo-400",
  J: "text-violet-400",
  K: "text-purple-400",
  L: "text-fuchsia-400",
  M: "text-pink-400",
  N: "text-rose-400",
  O: "text-orange-400",
  P: "text-amber-400",
  Q: "text-lime-400",
  R: "text-red-300",
  S: "text-orange-300",
  T: "text-yellow-300",
  U: "text-green-300",
  V: "text-teal-300",
  W: "text-blue-300",
  X: "text-violet-300",
  Y: "text-pink-300",
  Z: "text-zinc-400",
};

const priorityClass = (p: string): string =>
  PRIORITY_COLORS[p] ?? "text-zinc-400";

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

const TodoText = ({ text }: Props) => {
  const done = text.startsWith("x ");
  const tokens = tokenize(done ? text.slice(2) : text);

  return (
    <span className={done ? "text-zinc-700 line-through" : ""}>
      {tokens.flatMap((token, i) => [
        <TodoToken
          key={i}
          word={token.word}
          className={done ? "" : token.className}
        />,
        i < tokens.length - 1 ? " " : null,
      ])}
    </span>
  );
};

export default TodoText;
