import Div from "@base/Div";
import Paragraph from "@base/Paragraph";

import Hint from "@common/Hint";
import Response from "@common/Response";

const IntroResponse = () => {
  return (
    <Response>
      <Div className="flex flex-col gap-1">
        <Paragraph>
          Welcome to Headway — a terminal-based todo.txt manager.
        </Paragraph>
        <Paragraph>
          Manage your tasks with simple commands. All todos are stored locally in your browser.
        </Paragraph>
        <Hint>
          Type 'help' to see available commands.
        </Hint>
      </Div>
    </Response>
  );
};

export default IntroResponse;
