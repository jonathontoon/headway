import Response from '@components/Response';
import { commandDefs } from '@actions/registry';

const HelpResponse = () => {
  const categories = Array.from(new Set(commandDefs.map((d) => d.category)));

  return (
    <Response className="flex flex-col gap-2">
      <p className="text-gray-400">[command] [...arguments]</p>
      {categories.map((category) => (
        <div key={category}>
          <p className="text-white mt-4">{category}</p>
          <div className="space-y-1">
            {commandDefs
              .filter((d) => d.category === category)
              .map((def) => (
                <p key={def.usage} className="grid grid-cols-1 md:grid-cols-[180px_1fr] md:gap-4">
                  <span className="text-white">{def.usage}</span>
                  <span className="text-gray-500">{def.description}</span>
                </p>
              ))}
          </div>
        </div>
      ))}
    </Response>
  );
};

export default HelpResponse;
