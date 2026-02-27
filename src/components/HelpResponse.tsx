import type { HelpResponse as HelpResponseType } from "@types";
import Response from "./Response";
import HelpCommandRow from "@components/HelpCommandRow";

interface Props {
  response: HelpResponseType;
}

const HelpResponse = ({ response }: Props) => (
  <Response className="flex flex-col gap-3">
    {response.sections.map((section) => (
      <div key={section.title} className="flex flex-col gap-1.5">
        {section.commands.map((command) => (
          <HelpCommandRow key={command.name} {...command} />
        ))}
      </div>
    ))}
  </Response>
);

export default HelpResponse;
