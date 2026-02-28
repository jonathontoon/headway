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

const DATE_TOKEN = /^\d{4}-\d{2}-\d{2}$/;
const PRIORITY_TOKEN = /^\([A-Z]\)$/;

const tokenize = (text: string) => {
  const done = text.startsWith("x ");
  const tokens = text
    .split(" ")
    .slice(done ? 1 : 0)
    .map((word) => ({ word, className: "" }));

  let cursor = 0;

  if (!done && PRIORITY_TOKEN.test(tokens[0]?.word ?? "")) {
    tokens[0].className = priorityClass(tokens[0].word[1]);
    cursor = 1;
  }

  if (done && DATE_TOKEN.test(tokens[0]?.word ?? "")) {
    tokens[0].className = "text-terminal-muted";
    cursor = 1;
  }

  if (done && DATE_TOKEN.test(tokens[cursor]?.word ?? "")) {
    tokens[cursor].className = "text-terminal-muted";
  }

  return tokens.map((token) => {
    if (token.className) return token;
    if (token.word.startsWith("@"))
      return { ...token, className: "text-terminal-prioF" };
    if (token.word.startsWith("+"))
      return { ...token, className: "text-terminal-prioH" };
    return token;
  });
};

const TodoText = ({ text }: Props) => {
  const done = text.startsWith("x ");
  const tokens = tokenize(text);

  return (
    <span className={done ? "text-terminal-muted line-through" : ""}>
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
