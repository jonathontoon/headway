import { type ReactNode } from "react"

import StatusResponse from "@common/StatusResponse"
import DefaultResponse from "@common/DefaultResponse"

/**
 * Handles the 'echo' command by displaying the provided text.
 * @param {string[]} args - Array of arguments to echo
 */
const handleEchoCommand = async (
  args: string[],
  pushToHistory: (content: ReactNode) => void
) => {
  if (args.length === 0) {
    pushToHistory(
      <StatusResponse
        statusType="error"
        statusText="Please provide text to echo."
        hintText="Example: echo Hello, world!"
      />
    )
    return
  }

  pushToHistory(<DefaultResponse responseText={args.join(" ")} />)
}

export default handleEchoCommand
