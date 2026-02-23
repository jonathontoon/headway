import Response from '@common/Response';
import Span from '@base/Span';
import Div from '@base/Div';
import Paragraph from '@base/Paragraph';

const HelpResponse = () => (
  <Response className="flex flex-col gap-2">
    <Paragraph className="text-gray-400">[command] [...arguments]</Paragraph>

    <Paragraph className="text-white">Core Commands</Paragraph>

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
    </Div>

    <Paragraph className="text-white mt-4">Priority Management</Paragraph>

    <Div className="space-y-1">
      <Paragraph className="grid grid-cols-1 md:grid-cols-[180px_1fr] md:gap-4">
        <Span className="text-white">pri [n] [A-Z] / p</Span>
        <Span className="text-gray-500">Set priority (A-Z) on todo #n.</Span>
      </Paragraph>
      <Paragraph className="grid grid-cols-1 md:grid-cols-[180px_1fr] md:gap-4">
        <Span className="text-white">depri [n] / dp</Span>
        <Span className="text-gray-500">Remove priority from todo #n.</Span>
      </Paragraph>
    </Div>

    <Paragraph className="text-white mt-4">Text Editing</Paragraph>

    <Div className="space-y-1">
      <Paragraph className="grid grid-cols-1 md:grid-cols-[180px_1fr] md:gap-4">
        <Span className="text-white">append [n] [text] / app</Span>
        <Span className="text-gray-500">Append text to end of todo #n.</Span>
      </Paragraph>
      <Paragraph className="grid grid-cols-1 md:grid-cols-[180px_1fr] md:gap-4">
        <Span className="text-white">prepend [n] [text] / prep</Span>
        <Span className="text-gray-500">Prepend text to start of todo #n.</Span>
      </Paragraph>
      <Paragraph className="grid grid-cols-1 md:grid-cols-[180px_1fr] md:gap-4">
        <Span className="text-white">replace [n] [text]</Span>
        <Span className="text-gray-500">
          Replace todo #n entirely with new text.
        </Span>
      </Paragraph>
    </Div>

    <Paragraph className="text-white mt-4">Discovery</Paragraph>

    <Div className="space-y-1">
      <Paragraph className="grid grid-cols-1 md:grid-cols-[180px_1fr] md:gap-4">
        <Span className="text-white">listpri [A-Z] / lsp</Span>
        <Span className="text-gray-500">
          List all todos with priority (A-Z).
        </Span>
      </Paragraph>
      <Paragraph className="grid grid-cols-1 md:grid-cols-[180px_1fr] md:gap-4">
        <Span className="text-white">listcon / lsc</Span>
        <Span className="text-gray-500">List all unique @context tags.</Span>
      </Paragraph>
      <Paragraph className="grid grid-cols-1 md:grid-cols-[180px_1fr] md:gap-4">
        <Span className="text-white">listproj / lsprj</Span>
        <Span className="text-gray-500">List all unique +project tags.</Span>
      </Paragraph>
    </Div>

    <Paragraph className="text-white mt-4">Maintenance</Paragraph>

    <Div className="space-y-1">
      <Paragraph className="grid grid-cols-1 md:grid-cols-[180px_1fr] md:gap-4">
        <Span className="text-white">archive</Span>
        <Span className="text-gray-500">Remove all completed todos.</Span>
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
