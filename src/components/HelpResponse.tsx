import Response from "./Response";
import { commandDefs } from "@lib/commands/registry";

const HelpResponse = () => (
  <Response className="flex flex-col gap-2">
    <p className="text-gray-400">[command] [...arguments]</p>
    <div className="space-y-1">
      {commandDefs.map((def) => (
        <p
          key={def.usage}
          className="grid grid-cols-1 md:grid-cols-[180px_1fr] md:gap-4"
        >
          <span className="text-white">{def.usage}</span>
          <span className="text-gray-500">{def.description}</span>
        </p>
      ))}
    </div>
  </Response>
);

export default HelpResponse;
