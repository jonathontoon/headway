import type { TodoTask } from "../todos/types";
import { formatTask } from "../todos/format";

export type MessageTone = "error" | "warning" | "success" | "muted" | "normal";

export const OUTPUT_TYPE = {
  BLANK: "BLANK",
  TEXT: "TEXT",
  TASKS: "TASKS",
  HELP: "HELP",
  PROGRESS: "PROGRESS",
  BOOT: "BOOT",
  GREETING: "GREETING",
  SECONDARY: "SECONDARY",
  LINK: "LINK",
  GROUP: "GROUP",
} as const;

export type TerminalOutputType = (typeof OUTPUT_TYPE)[keyof typeof OUTPUT_TYPE];

export type TerminalOutput =
  | { readonly type: typeof OUTPUT_TYPE.BLANK }
  | {
      readonly type: typeof OUTPUT_TYPE.TEXT;
      readonly text: string;
      readonly tone: MessageTone;
    }
  | {
      readonly type: typeof OUTPUT_TYPE.TASKS;
      readonly tasks: readonly TerminalTask[];
    }
  | { readonly type: typeof OUTPUT_TYPE.HELP }
  | {
      readonly type: typeof OUTPUT_TYPE.PROGRESS;
      readonly text: string;
    }
  | { readonly type: typeof OUTPUT_TYPE.BOOT; readonly text: string }
  | {
      readonly type: typeof OUTPUT_TYPE.GREETING;
      readonly text: string;
    }
  | {
      readonly type: typeof OUTPUT_TYPE.SECONDARY;
      readonly text: string;
    }
  | { readonly type: typeof OUTPUT_TYPE.LINK; readonly href: string }
  | {
      readonly type: typeof OUTPUT_TYPE.GROUP;
      readonly items: readonly TerminalOutput[];
    };

export type TerminalTask = {
  readonly position: number;
  readonly task: TodoTask;
};

function message(text: string, tone: MessageTone = "normal"): TerminalOutput {
  return { type: OUTPUT_TYPE.TEXT, text, tone };
}

export const terminalOutput = {
  blank: (): TerminalOutput => ({ type: OUTPUT_TYPE.BLANK }),
  text: message,
  error: (text: string): TerminalOutput => message(text, "error"),
  warning: (text: string): TerminalOutput => message(text, "warning"),
  success: (text: string): TerminalOutput => message(text, "success"),
  muted: (text: string): TerminalOutput => message(text, "muted"),
  help: (): TerminalOutput => ({ type: OUTPUT_TYPE.HELP }),
  progress: (text: string): TerminalOutput => ({
    type: OUTPUT_TYPE.PROGRESS,
    text,
  }),
  boot: (text: string): TerminalOutput => ({
    type: OUTPUT_TYPE.BOOT,
    text,
  }),
  greeting: (text: string): TerminalOutput => ({
    type: OUTPUT_TYPE.GREETING,
    text,
  }),
  secondary: (text: string): TerminalOutput => ({
    type: OUTPUT_TYPE.SECONDARY,
    text,
  }),
  link: (href: string): TerminalOutput => ({
    type: OUTPUT_TYPE.LINK,
    href,
  }),
  tasks: (tasks: readonly TerminalTask[]): TerminalOutput => ({
    type: OUTPUT_TYPE.TASKS,
    tasks,
  }),
  group: (...items: readonly TerminalOutput[]): TerminalOutput => ({
    type: OUTPUT_TYPE.GROUP,
    items,
  }),
};

export function outputText(
  output: TerminalOutput | string | undefined,
): string | undefined {
  if (output === undefined) return undefined;
  if (typeof output === "string") return output;

  switch (output.type) {
    case OUTPUT_TYPE.BLANK:
      return "";
    case OUTPUT_TYPE.TEXT:
    case OUTPUT_TYPE.PROGRESS:
    case OUTPUT_TYPE.BOOT:
    case OUTPUT_TYPE.GREETING:
    case OUTPUT_TYPE.SECONDARY:
      return output.text;
    case OUTPUT_TYPE.LINK:
      return output.href;
    case OUTPUT_TYPE.HELP:
      return "help";
    case OUTPUT_TYPE.TASKS:
      return output.tasks
        .map(({ position, task }) => formatTask(position, task))
        .join("\n");
    case OUTPUT_TYPE.GROUP:
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
