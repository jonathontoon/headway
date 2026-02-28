import type { HelpResponse as HelpResponseType } from "@types";
import Response from "./Response";
import HelpCommandRow from "@components/HelpCommandRow";

interface Props {
  response: HelpResponseType;
}

const HelpResponse = ({ response }: Props) => (
  <Response as="dl" className="m-0 flex flex-col gap-2">
    {response.sections.flatMap((section, sectionIndex) =>
      section.commands.map((command, commandIndex) => (
        <HelpCommandRow
          key={`${section.title}-${sectionIndex}-${command.name}-${commandIndex}`}
          {...command}
        />
      ))
    )}
  </Response>
);

export default HelpResponse;
