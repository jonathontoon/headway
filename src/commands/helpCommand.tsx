import type { ReactNode } from "react";
import HelpResponse from "@common/HelpResponse";

const helpCommand = (pushToHistory: (content: ReactNode) => void) => {
  pushToHistory(
    <HelpResponse />
  );
};

export default helpCommand;
