import type { HelpResponse as HelpResponseType } from "@types";
import Response from "./Response";
import HelpCommandRow from "@components/HelpCommandRow";

interface Props {
  response: HelpResponseType;
}

const HelpResponse = ({ response }: Props) => (
  <Response className="flex flex-col gap-0.5">
    {response.commands.map((command) => (
      <HelpCommandRow key={command.name} {...command} />
    ))}
  </Response>
);

export default HelpResponse;
