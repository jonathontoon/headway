import { memo, type FunctionComponent } from "react";

import Response from "./Response";

interface LogoResponseProps {
  className?: string;
}

const LogoResponse: FunctionComponent<LogoResponseProps> = memo(
  ({ className }) => (
    <Response className={className}>
      <p className="flex items-center gap-2">
        <span className="text-blue-500">✦</span>
        <span className="text-red-500">✧</span>
        <span className="text-green-500">✦</span>
      </p>
    </Response>
  )
);

export default LogoResponse;
