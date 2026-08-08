import { Fragment } from "react";
import { HELP_TEXT } from "../commands/registry";

const SECTION_HEADERS = new Set([
  "TASKS",
  "STATUS",
  "ATTRIBUTES",
  "VIEWS",
  "SYNC",
  "OTHER",
  "OVERDUE",
  "TODAY",
]);

const HELP_ROW_PATTERN = /^(.+?)(?: - |\s{2,})(.+)$/;
const HELP_ARG_PATTERN = /(<[^>]+>|"[^"]*")/g;

const renderHelpCommandSegment = (segment: string) => {
  return segment.split(HELP_ARG_PATTERN).map((part, i) =>
    part.startsWith("<") || part.startsWith('"') ? (
      <span key={i} className="text-role-accent">
        {part}
      </span>
    ) : (
      part
    ),
  );
};

/**
 * Renders terminal help text as command and description columns.
 *
 * @returns The formatted help output.
 */
export const TerminalHelpOutput = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[max-content_1fr] gap-x-4 gap-y-0 sm:gap-y-[0.5em]">
      {HELP_TEXT.split("\n").map((line, i) => {
        if (line === "") {
          return (
            <div
              key={i}
              className="sm:col-span-2 h-2 sm:h-0"
              aria-hidden="true"
            />
          );
        }

        if (SECTION_HEADERS.has(line)) {
          return (
            <div
              key={`${line}-${i}`}
              className="sm:col-span-2 whitespace-pre-wrap text-role-muted"
            >
              {line}
            </div>
          );
        }

        const helpMatch = line.match(HELP_ROW_PATTERN);
        if (helpMatch) {
          const command = helpMatch[1]!;
          const description = helpMatch[2]!;

          return (
            <Fragment key={`${command}-${i}`}>
              <span className="whitespace-pre-wrap text-role-command pl-[1ch]">
                {renderHelpCommandSegment(command)}
              </span>
              <span className="whitespace-pre-wrap text-role-muted mb-2 sm:mb-0">
                {description}
              </span>
            </Fragment>
          );
        }

        return (
          <div
            key={`${line}-${i}`}
            className="sm:col-span-2 whitespace-pre-wrap pl-[1ch] text-role-muted"
          >
            {line}
          </div>
        );
      })}
    </div>
  );
};
