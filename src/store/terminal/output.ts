import type { TodoTask } from "../todos/types";
import { formatTask } from "../todos/format";

export type MessageTone = "error" | "warning" | "success" | "muted" | "normal";

export type TerminalOutput =
  | { readonly kind: "blank" }
  | { readonly kind: "text"; readonly text: string; readonly tone: MessageTone }
  | { readonly kind: "tasks"; readonly tasks: readonly TerminalTask[] }
  | { readonly kind: "help" }
  | { readonly kind: "progress"; readonly text: string }
  | { readonly kind: "boot"; readonly text: string }
  | { readonly kind: "greeting"; readonly text: string }
  | { readonly kind: "secondary"; readonly text: string }
  | { readonly kind: "link"; readonly href: string }
  | { readonly kind: "group"; readonly items: readonly TerminalOutput[] };

export type TerminalTask = {
  readonly position: number;
  readonly task: TodoTask;
};

function message(text: string, tone: MessageTone = "normal"): TerminalOutput {
  return { kind: "text", text, tone };
}

export const terminalOutput = {
  blank: (): TerminalOutput => ({ kind: "blank" }),
  text: message,
  error: (text: string): TerminalOutput => message(text, "error"),
  warning: (text: string): TerminalOutput => message(text, "warning"),
  success: (text: string): TerminalOutput => message(text, "success"),
  muted: (text: string): TerminalOutput => message(text, "muted"),
  help: (): TerminalOutput => ({ kind: "help" }),
  progress: (text: string): TerminalOutput => ({ kind: "progress", text }),
  boot: (text: string): TerminalOutput => ({ kind: "boot", text }),
  greeting: (text: string): TerminalOutput => ({ kind: "greeting", text }),
  secondary: (text: string): TerminalOutput => ({ kind: "secondary", text }),
  link: (href: string): TerminalOutput => ({ kind: "link", href }),
  tasks: (tasks: readonly TerminalTask[]): TerminalOutput => ({
    kind: "tasks",
    tasks,
  }),
  group: (...items: readonly TerminalOutput[]): TerminalOutput => ({
    kind: "group",
    items,
  }),
};

export function outputText(
  output: TerminalOutput | string | undefined,
): string | undefined {
  if (output === undefined) return undefined;
  if (typeof output === "string") return output;

  switch (output.kind) {
    case "blank":
      return "";
    case "text":
    case "progress":
    case "boot":
    case "greeting":
    case "secondary":
      return output.text;
    case "link":
      return output.href;
    case "help":
      return "help";
    case "tasks":
      return output.tasks
        .map(({ position, task }) => formatTask(position, task))
        .join("\n");
    case "group":
      return output.items
        .map(outputText)
        .filter((item): item is string => item !== undefined)
        .join("\n");
  }
}

export function toTerminalOutput(
  output: TerminalOutput | string,
): TerminalOutput {
  if (typeof output !== "string") return output;

  if (output.startsWith("Error:")) return terminalOutput.error(output);
  if (output.startsWith("Warning:")) return terminalOutput.warning(output);
  if (
    /^(Added:|Updated:|Deleted:|Completed:|Reopened:|Saved:|Loaded:|Connected|Disconnected)/.test(
      output,
    )
  ) {
    return terminalOutput.success(output);
  }
  if (
    /\b(empty|is clear|No |not a recognized command|not found)\b/i.test(output)
  ) {
    return terminalOutput.muted(output);
  }
  return terminalOutput.text(output);
}
