import Response from "./Response";
import Stack from "./Stack";
import Label from "./Label";
import Muted from "./Muted";
import { commandDefs } from "@constants";

const HelpResponse = () => (
  <Response>
    <Stack gap={2}>
      <Label>[command] [...arguments]</Label>
      <Stack>
        {commandDefs.map((def) => (
          <p
            key={def.usage}
            className="grid grid-cols-1 md:grid-cols-[200px_1fr] md:gap-4"
          >
            {def.usage}
            <Muted>{def.description}</Muted>
          </p>
        ))}
      </Stack>
    </Stack>
  </Response>
);

export default HelpResponse;
