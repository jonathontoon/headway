import Response from '@common/Response';
import Span from '@base/Span';
import Div from '@base/Div';
import Paragraph from '@base/Paragraph';

const HelpResponse = () => (
  <Response className="flex flex-col gap-2">
    <Paragraph className="text-gray-400">[command] [...arguments]</Paragraph>

    <Paragraph className="text-white">Commands</Paragraph>

    <Div className="space-y-1">
      <Paragraph className="grid grid-cols-1 md:grid-cols-[180px_1fr] md:gap-4">
        <Span className="text-white">add [text] / a</Span>
        <Span className="text-gray-500">Add a new todo item.</Span>
      </Paragraph>
      <Paragraph className="grid grid-cols-1 md:grid-cols-[180px_1fr] md:gap-4">
        <Span className="text-white">list [filter] / ls</Span>
        <Span className="text-gray-500">
          List all todos, optionally filter by @context or +project.
        </Span>
      </Paragraph>
      <Paragraph className="grid grid-cols-1 md:grid-cols-[180px_1fr] md:gap-4">
        <Span className="text-white">done [n]</Span>
        <Span className="text-gray-500">Mark todo #n as complete.</Span>
      </Paragraph>
      <Paragraph className="grid grid-cols-1 md:grid-cols-[180px_1fr] md:gap-4">
        <Span className="text-white">delete [n] / rm</Span>
        <Span className="text-gray-500">Delete todo #n.</Span>
      </Paragraph>
      <Paragraph className="grid grid-cols-1 md:grid-cols-[180px_1fr] md:gap-4">
        <Span className="text-white">clear</Span>
        <Span className="text-gray-500">Clear the terminal screen.</Span>
      </Paragraph>
      <Paragraph className="grid grid-cols-1 md:grid-cols-[180px_1fr] md:gap-4">
        <Span className="text-white">help</Span>
        <Span className="text-gray-500">Show this help message.</Span>
      </Paragraph>
    </Div>
  </Response>
);

export default HelpResponse;
