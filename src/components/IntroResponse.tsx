import { Hint, Response } from "../base";

const IntroResponse = () => (
  <Response>
    <div className="flex flex-col gap-1">
      <p>Welcome to Headway — a terminal-based todo.txt manager.</p>
      <p>
        Manage your tasks with simple commands. All todos are stored locally in
        your browser.
      </p>
      <Hint>Type 'help' to see available commands.</Hint>
    </div>
  </Response>
);

export default IntroResponse;
