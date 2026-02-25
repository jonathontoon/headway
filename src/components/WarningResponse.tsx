import type { WarningResponse as WarningResponseType } from "@types";
import Response from "./Response";

interface Props {
  response: WarningResponseType;
}

const WarningResponse = ({ response }: Props) => (
  <Response className="flex gap-2 text-amber-400">
    <span className="select-none shrink-0" aria-hidden>~</span>
    <span>{response.text}</span>
  </Response>
);

export default WarningResponse;
