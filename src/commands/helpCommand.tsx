import type { ReactNode } from "react"
import HelpResponse from "@organisms/HelpResponse"

const helpCommand = (pushToHistory: (content: ReactNode) => void) => {
  pushToHistory(<HelpResponse />)
}

export default helpCommand
