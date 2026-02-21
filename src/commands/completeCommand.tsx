import type { ReactNode } from "react"

import DefaultResponse from "@organisms/DefaultResponse"
import QuoteResponse from "@organisms/QuoteResponse"

/**
 * Handles the 'complete' command by initiating an interactive sentence completion.
 * Sets up an awaiting input state for user response.
 */
const handleCompleteCommand = async (
  setIsProcessing: (isProcessing: boolean) => void,
  pushToHistory: (content: ReactNode) => void,
  setAwaitingInput: (
    awaitingInput: { callback: (input: string) => void } | null
  ) => void
) => {
  setIsProcessing(true)

  await pushToHistory(
    <DefaultResponse responseText="Let's complete this sentence:" />
  )

  await pushToHistory(
    <QuoteResponse quoteText="The quick brown fox jumps over..." />
  )

  // Set up the awaiting input state without the type
  setAwaitingInput({
    callback: async (input: string) => {
      const fullSentence = `The quick brown fox jumps over ${input}`

      await pushToHistory(<DefaultResponse responseText={fullSentence} />)

      setIsProcessing(false)
      setAwaitingInput(null)
    },
  })
}

export default handleCompleteCommand
