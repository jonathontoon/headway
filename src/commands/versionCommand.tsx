import type { ReactNode } from "react"
import VersionResponse from "@organisms/VersionResponse"

/**
 * Handles the 'version' command by displaying the current version number.
 */
const handleVersionCommand = (pushToHistory: (content: ReactNode) => void) => {
  pushToHistory(<VersionResponse />)
}

export default handleVersionCommand
