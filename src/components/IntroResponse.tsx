import { memo } from "react";
import Hint from "./Hint";
import Response from "./Response";
import Stack from "./Stack";
import Text from "./Text";

const IntroResponse = memo(() => (
  <Response>
    <Stack>
      <Text>Welcome to Headway — a terminal-based todo.txt manager.</Text>
      <Text>
        Manage your tasks with simple commands. All todos are stored locally in
        your browser.
      </Text>
      <Hint>Type 'help' to see available commands.</Hint>
    </Stack>
  </Response>
));

export default IntroResponse;
