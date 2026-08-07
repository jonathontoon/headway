import type { TodoTask } from "../todos/types";
import { formatTask } from "../todos/format";

export type MessageTone = "error" | "warning" | "success" | "muted" | "normal";

export const TERMINAL_OUTPUT_KIND = {
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

export type TerminalOutputKind =
  (typeof TERMINAL_OUTPUT_KIND)[keyof typeof TERMINAL_OUTPUT_KIND];

export type TerminalOutput =
  | { readonly kind: typeof TERMINAL_OUTPUT_KIND.BLANK }
  | {
      readonly kind: typeof TERMINAL_OUTPUT_KIND.TEXT;
      readonly text: string;
      readonly tone: MessageTone;
    }
  | {
      readonly kind: typeof TERMINAL_OUTPUT_KIND.TASKS;
      readonly tasks: readonly TerminalTask[];
    }
  | { readonly kind: typeof TERMINAL_OUTPUT_KIND.HELP }
  | {
      readonly kind: typeof TERMINAL_OUTPUT_KIND.PROGRESS;
      readonly text: string;
    }
  | { readonly kind: typeof TERMINAL_OUTPUT_KIND.BOOT; readonly text: string }
  | {
      readonly kind: typeof TERMINAL_OUTPUT_KIND.GREETING;
      readonly text: string;
    }
  | {
      readonly kind: typeof TERMINAL_OUTPUT_KIND.SECONDARY;
      readonly text: string;
    }
  | { readonly kind: typeof TERMINAL_OUTPUT_KIND.LINK; readonly href: string }
  | {
      readonly kind: typeof TERMINAL_OUTPUT_KIND.GROUP;
      readonly items: readonly TerminalOutput[];
    };

export type TerminalTask = {
  readonly position: number;
  readonly task: TodoTask;
};

function message(text: string, tone: MessageTone = "normal"): TerminalOutput {
  return { kind: TERMINAL_OUTPUT_KIND.TEXT, text, tone };
}

export const terminalOutput = {
  blank: (): TerminalOutput => ({ kind: TERMINAL_OUTPUT_KIND.BLANK }),
  text: message,
  error: (text: string): TerminalOutput => message(text, "error"),
  warning: (text: string): TerminalOutput => message(text, "warning"),
  success: (text: string): TerminalOutput => message(text, "success"),
  muted: (text: string): TerminalOutput => message(text, "muted"),
  help: (): TerminalOutput => ({ kind: TERMINAL_OUTPUT_KIND.HELP }),
  progress: (text: string): TerminalOutput => ({
    kind: TERMINAL_OUTPUT_KIND.PROGRESS,
    text,
  }),
  boot: (text: string): TerminalOutput => ({
    kind: TERMINAL_OUTPUT_KIND.BOOT,
    text,
  }),
  greeting: (text: string): TerminalOutput => ({
    kind: TERMINAL_OUTPUT_KIND.GREETING,
    text,
  }),
  secondary: (text: string): TerminalOutput => ({
    kind: TERMINAL_OUTPUT_KIND.SECONDARY,
    text,
  }),
  link: (href: string): TerminalOutput => ({
    kind: TERMINAL_OUTPUT_KIND.LINK,
    href,
  }),
  tasks: (tasks: readonly TerminalTask[]): TerminalOutput => ({
    kind: TERMINAL_OUTPUT_KIND.TASKS,
    tasks,
  }),
  group: (...items: readonly TerminalOutput[]): TerminalOutput => ({
    kind: TERMINAL_OUTPUT_KIND.GROUP,
    items,
  }),
};

export function outputText(
  output: TerminalOutput | string | undefined,
): string | undefined {
  if (output === undefined) return undefined;
  if (typeof output === "string") return output;

  switch (output.kind) {
    case TERMINAL_OUTPUT_KIND.BLANK:
      return "";
    case TERMINAL_OUTPUT_KIND.TEXT:
    case TERMINAL_OUTPUT_KIND.PROGRESS:
    case TERMINAL_OUTPUT_KIND.BOOT:
    case TERMINAL_OUTPUT_KIND.GREETING:
    case TERMINAL_OUTPUT_KIND.SECONDARY:
      return output.text;
    case TERMINAL_OUTPUT_KIND.LINK:
      return output.href;
    case TERMINAL_OUTPUT_KIND.HELP:
      return "help";
    case TERMINAL_OUTPUT_KIND.TASKS:
      return output.tasks
        .map(({ position, task }) => formatTask(position, task))
        .join("\n");
    case TERMINAL_OUTPUT_KIND.GROUP:
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
