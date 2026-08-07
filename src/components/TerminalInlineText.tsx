import { Fragment } from "react";

type TerminalInlineTextProps = {
  readonly line: string;
};

const URL_PATTERN = /^https?:\/\//;
const HEART_PATTERN = /(♥)/;
const INLINE_URL_PATTERN = /(https?:\/\/\S+)/g;
const DEVICE_CODE_PATTERN = /\b([A-Z0-9]{4}-[A-Z0-9]{4})\b/g;
const DEVICE_CODE_TEST_PATTERN = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/;

const TerminalHeartText = ({ line }: TerminalInlineTextProps) => {
  if (!HEART_PATTERN.test(line)) return line;

  return line.split(HEART_PATTERN).map((part, i) =>
    part === "♥" ? (
      <span key={i} className="text-role-error">
        {part}
      </span>
    ) : (
      part
    ),
  );
};

const TerminalDeviceCodeText = ({ line }: TerminalInlineTextProps) => {
  const parts = line.split(DEVICE_CODE_PATTERN);

  if (parts.length === 1) {
    return <TerminalHeartText line={line} />;
  }

  return (
    <Fragment>
      {parts.map((part, i) =>
        DEVICE_CODE_TEST_PATTERN.test(part) ? (
          <span key={i} className="text-role-context font-bold">
            {part}
          </span>
        ) : (
          <Fragment key={i}>
            <TerminalHeartText line={part} />
          </Fragment>
        ),
      )}
    </Fragment>
  );
};

export const TerminalInlineText = ({ line }: TerminalInlineTextProps) => {
  const segments = line.split(INLINE_URL_PATTERN);

  if (segments.length === 1) {
    return <TerminalDeviceCodeText line={line} />;
  }

  return segments.map((segment, i) =>
    URL_PATTERN.test(segment) ? (
      <a
        key={i}
        href={segment}
        target="_blank"
        rel="noopener noreferrer"
        className="text-role-accent underline hover:no-underline"
      >
        {segment}
      </a>
    ) : (
      <Fragment key={i}>
        <TerminalDeviceCodeText line={segment} />
      </Fragment>
    ),
  );
};
