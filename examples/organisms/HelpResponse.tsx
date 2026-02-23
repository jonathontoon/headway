import Response from "@molecules/Response.tsx";
import Span from "@atoms/Span.tsx";
import Div from "@atoms/Div.tsx";
import Paragraph from "@atoms/Paragraph.tsx";

const HelpResponse = () => {
  return (
    <Response className="flex flex-col gap-4 py-6">
      <Paragraph className="text-gray-400">
        [command] [...arguments]
      </Paragraph>
      
      <Paragraph className="text-white">
          Commands
        </Paragraph>
      
       <Div className="space-y-1">
          <Paragraph className="grid grid-cols-1 md:grid-cols-[180px_1fr] md:gap-4">
            <Span className="text-white">start</Span>
            <Span className="text-gray-500">Begin the encryption process.</Span>
          </Paragraph>
          <Paragraph className="grid grid-cols-1 md:grid-cols-[180px_1fr] md:gap-4">
            <Span className="text-white">countdown [seconds]</Span>
            <Span className="text-gray-500">Start a countdown timer for specified duration.</Span>
          </Paragraph>
          <Paragraph className="grid grid-cols-1 md:grid-cols-[180px_1fr] md:gap-4">
            <Span className="text-white">echo [text]</Span>
            <Span className="text-gray-500">Repeat back the provided text.</Span>
          </Paragraph>
          <Paragraph className="grid grid-cols-1 md:grid-cols-[180px_1fr] md:gap-4">
            <Span className="text-white">clear</Span>
            <Span className="text-gray-500">Clear the terminal screen.</Span>
          </Paragraph>
          <Paragraph className="grid grid-cols-1 md:grid-cols-[180px_1fr] md:gap-4">
            <Span className="text-white">help</Span>
            <Span className="text-gray-500">Show this help message.</Span>
          </Paragraph>
          <Paragraph className="grid grid-cols-1 md:grid-cols-[180px_1fr] md:gap-4">
            <Span className="text-white">version</Span>
            <Span className="text-gray-500">Show version number.</Span>
          </Paragraph>
        </Div>
    </Response>
  );
};

export default HelpResponse;