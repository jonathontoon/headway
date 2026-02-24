import Response from "./Response";
import Stack from "./Stack";
import Muted from "./Muted";
import { commandDefs } from "@constants";

const HelpResponse = () => (
  <Response className="flex flex-col gap-2">
    <p className="text-gray-400">[command] [...arguments]</p>
    <Stack>
      {commandDefs.map((def) => (
        <p
          key={def.usage}
          className="grid grid-cols-1 md:grid-cols-[200px_1fr] md:gap-4"
        >
          <span className="text-white">{def.usage}</span>
          <Muted>{def.description}</Muted>
        </p>
      ))}
    </Stack>
  </Response>
);

export default HelpResponse;
