import type { HelpSection } from "@reducers/terminal/terminalTypes";
import Response from "@components/ui/Response";
import HelpCommandRow from "@components/terminal/HelpCommandRow";

interface Props {
  sections: readonly HelpSection[];
}

const HelpResponse = ({ sections }: Props) => (
  <Response as="dl" className="m-0 flex flex-col gap-2">
    {sections.flatMap((section, sectionIndex) =>
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
