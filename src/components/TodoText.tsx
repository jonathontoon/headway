import TodoToken from "@components/TodoToken";

interface Props {
  text: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  A: "text-terminal-prioA",
  B: "text-terminal-prioB",
  C: "text-terminal-prioC",
  D: "text-terminal-prioD",
  E: "text-terminal-prioE",
  F: "text-terminal-prioF",
  G: "text-terminal-prioG",
  H: "text-terminal-prioH",
  I: "text-terminal-prioI",
  J: "text-terminal-prioJ",
  K: "text-terminal-prioK",
  L: "text-terminal-prioL",
  M: "text-terminal-prioM",
  N: "text-terminal-prioN",
  O: "text-terminal-prioO",
  P: "text-terminal-prioP",
  Q: "text-terminal-prioQ",
  R: "text-terminal-prioR",
  S: "text-terminal-prioS",
  T: "text-terminal-prioT",
  U: "text-terminal-prioU",
  V: "text-terminal-prioV",
  W: "text-terminal-prioW",
  X: "text-terminal-prioX",
  Y: "text-terminal-prioY",
  Z: "text-terminal-prioZ",
};

const priorityClass = (p: string): string =>
  PRIORITY_COLORS[p] ?? "text-terminal-text";

const tokenize = (text: string) =>
  text.split(" ").map((word) => {
    if (/^\([A-Z]\)$/.test(word))
      return { word, className: priorityClass(word[1]) };
    if (/^\d{4}-\d{2}-\d{2}$/.test(word))
      return { word, className: "text-zinc-600" };
    if (word.startsWith("@")) return { word, className: "text-terminal-prioF" };
    if (word.startsWith("+")) return { word, className: "text-terminal-prioH" };
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
