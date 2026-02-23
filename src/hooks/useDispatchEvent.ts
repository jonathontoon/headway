import { useEffect } from "react";
import delay from "@utilities/delay";

/**
 * Custom hook to dispatch a custom event after component mount
 * @param {string} eventName - The name of the event to dispatch
 * @param {number} [delayMs] - Optional delay in milliseconds before dispatching the event
 */
const useDispatchEvent = (eventName: string, delayMs?: number): void => {
  useEffect(() => {
    const dispatchEvent = async () => {
      if (delayMs) {
        await delay(delayMs);
      }
      window.dispatchEvent(new Event(eventName));
    };

    dispatchEvent();
  }, [eventName, delayMs]);
};

export default useDispatchEvent;
