import type { CSSProperties } from "react";
import type { MessageTone } from "../store/terminal/output";
import { TerminalInlineText } from "./TerminalInlineText";

type TerminalMessageProps = {
  readonly line: string;
  readonly tone: MessageTone;
};

const toneClassName = (tone: MessageTone): string => {
  switch (tone) {
    case "error":
      return "text-role-error";
    case "warning":
      return "text-role-warning";
    case "success":
      return "text-role-success";
    case "muted":
      return "text-role-muted";
    case "normal":
      return "";
  }
};

const messageGlyph = (tone: MessageTone): string => {
  if (tone === "error") return "×";
  if (tone === "warning") return "▫";
  return "→";
};

const hangingIndentStyle = (prefix: string): CSSProperties => {
  const width = `${prefix.length}ch`;
  return { paddingLeft: width, textIndent: `-${width}` };
};

const capitalize = (text: string): string => {
  return text.length === 0 ? text : text[0]!.toUpperCase() + text.slice(1);
};

const stripRedundantLabel = (line: string, tone: MessageTone): string => {
  if (tone === "error" && line.startsWith("Error:")) {
    return capitalize(line.slice("Error:".length).trim());
  }

  if (tone === "warning" && line.startsWith("Warning:")) {
    return capitalize(line.slice("Warning:".length).trim());
  }

  return line;
};

/**
 * Renders a single terminal message with tone color and glyph.
 *
 * @param props - Message line and semantic tone.
 * @returns The formatted message row.
 */
export const TerminalMessage = ({ line, tone }: TerminalMessageProps) => {
  const colorClass = toneClassName(tone);
  const prefix = ` ${messageGlyph(tone)} `;

  return (
    <div
      className={`block whitespace-pre-wrap ${colorClass}`}
      style={hangingIndentStyle(prefix)}
    >
      {prefix}
      <TerminalInlineText line={stripRedundantLabel(line, tone)} />
    </div>
  );
};
