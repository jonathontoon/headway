import { type ReactNode } from "react"
import DefaultResponse from "@organisms/DefaultResponse"
import StatusResponse from "@organisms/StatusResponse"
import CountdownResponse from "@organisms/CountdownResponse"

/**
 * Handles the 'countdown' command by displaying a countdown sequence.
 * @param {string} startCount - The number to start counting down from
 * @throws {Error} When the countdown system malfunctions (5% chance)
 */
const handleCountdownCommand = async (
  startCount: string,
  pushToHistory: (content: ReactNode) => void,
  setIsProcessing: (isProcessing: boolean) => void,
  pushToHistoryWithDelay: (content: ReactNode, delay: number) => void
) => {
  const count = parseInt(startCount, 10)
  if (isNaN(count) || count < 0) {
    pushToHistory(
      <StatusResponse
        statusType="error"
        statusText="Please provide a valid positive number."
        hintText="Example: countdown 10"
      />
    )
    return
  }

  setIsProcessing(true)

  try {
    // Initial message
    await pushToHistoryWithDelay(
      <DefaultResponse responseText="Starting countdown..." />,
      0
    )

    // Simulate a random error condition (5% chance)
    if (Math.random() < 0.05) {
      throw new Error("Countdown system malfunction!")
    }

    // Count down from startCount to 0
    for (let i = count; i >= 0; i--) {
      await pushToHistoryWithDelay(<CountdownResponse count={i} />, 1000)
    }

    // Final message
    await pushToHistoryWithDelay(
      <StatusResponse statusType="success" statusText="Countdown complete!" />,
      1000
    )
  } catch (error) {
    await pushToHistoryWithDelay(
      <StatusResponse
        statusType="error"
        statusText={
          error instanceof Error ? error.message : "An unknown error occurred"
        }
      />,
      0
    )
  } finally {
    setIsProcessing(false)
  }
}

export default handleCountdownCommand
