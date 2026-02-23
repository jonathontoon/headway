import Response from '@common/Response';

const HelpResponse = () => (
  <Response className="flex flex-col gap-2">
    <p className="text-gray-400">[command] [...arguments]</p>

    <p className="text-white">Core Commands</p>

    <div className="space-y-1">
      <p className="grid grid-cols-1 md:grid-cols-[180px_1fr] md:gap-4">
        <span className="text-white">add [text] / a</span>
        <span className="text-gray-500">Add a new todo item.</span>
      </p>
      <p className="grid grid-cols-1 md:grid-cols-[180px_1fr] md:gap-4">
        <span className="text-white">list [filter] / ls</span>
        <span className="text-gray-500">
          List all todos, optionally filter by @context or +project.
        </span>
      </p>
      <p className="grid grid-cols-1 md:grid-cols-[180px_1fr] md:gap-4">
        <span className="text-white">done [n]</span>
        <span className="text-gray-500">Mark todo #n as complete.</span>
      </p>
      <p className="grid grid-cols-1 md:grid-cols-[180px_1fr] md:gap-4">
        <span className="text-white">delete [n] / rm</span>
        <span className="text-gray-500">Delete todo #n.</span>
      </p>
    </div>

    <p className="text-white mt-4">Priority Management</p>

    <div className="space-y-1">
      <p className="grid grid-cols-1 md:grid-cols-[180px_1fr] md:gap-4">
        <span className="text-white">pri [n] [A-Z] / p</span>
        <span className="text-gray-500">Set priority (A-Z) on todo #n.</span>
      </p>
      <p className="grid grid-cols-1 md:grid-cols-[180px_1fr] md:gap-4">
        <span className="text-white">depri [n] / dp</span>
        <span className="text-gray-500">Remove priority from todo #n.</span>
      </p>
    </div>

    <p className="text-white mt-4">Text Editing</p>

    <div className="space-y-1">
      <p className="grid grid-cols-1 md:grid-cols-[180px_1fr] md:gap-4">
        <span className="text-white">append [n] [text] / app</span>
        <span className="text-gray-500">Append text to end of todo #n.</span>
      </p>
      <p className="grid grid-cols-1 md:grid-cols-[180px_1fr] md:gap-4">
        <span className="text-white">prepend [n] [text] / prep</span>
        <span className="text-gray-500">Prepend text to start of todo #n.</span>
      </p>
      <p className="grid grid-cols-1 md:grid-cols-[180px_1fr] md:gap-4">
        <span className="text-white">replace [n] [text]</span>
        <span className="text-gray-500">
          Replace todo #n entirely with new text.
        </span>
      </p>
    </div>

    <p className="text-white mt-4">Discovery</p>

    <div className="space-y-1">
      <p className="grid grid-cols-1 md:grid-cols-[180px_1fr] md:gap-4">
        <span className="text-white">listpri [A-Z] / lsp</span>
        <span className="text-gray-500">
          List all todos with priority (A-Z).
        </span>
      </p>
      <p className="grid grid-cols-1 md:grid-cols-[180px_1fr] md:gap-4">
        <span className="text-white">listcon / lsc</span>
        <span className="text-gray-500">List all unique @context tags.</span>
      </p>
      <p className="grid grid-cols-1 md:grid-cols-[180px_1fr] md:gap-4">
        <span className="text-white">listproj / lsprj</span>
        <span className="text-gray-500">List all unique +project tags.</span>
      </p>
    </div>

    <p className="text-white mt-4">Maintenance</p>

    <div className="space-y-1">
      <p className="grid grid-cols-1 md:grid-cols-[180px_1fr] md:gap-4">
        <span className="text-white">archive</span>
        <span className="text-gray-500">Remove all completed todos.</span>
      </p>
      <p className="grid grid-cols-1 md:grid-cols-[180px_1fr] md:gap-4">
        <span className="text-white">clear</span>
        <span className="text-gray-500">Clear the terminal screen.</span>
      </p>
      <p className="grid grid-cols-1 md:grid-cols-[180px_1fr] md:gap-4">
        <span className="text-white">help</span>
        <span className="text-gray-500">Show this help message.</span>
      </p>
    </div>
  </Response>
);

export default HelpResponse;
