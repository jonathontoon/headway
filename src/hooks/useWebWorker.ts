import { useEffect, useCallback, useRef, useState } from "react"

interface WorkerArguments {
  path: string
  options: WorkerOptions
}

const useWebWorker = ({ path, options }: WorkerArguments) => {
  const workerRef = useRef<Worker | null>(null)
  const [isSupported] = useState<boolean | null>(() => {
    return typeof window !== "undefined" && "Worker" in window
  })

  const messageHandlerRef = useRef<((event: MessageEvent) => void) | null>(null)
  const errorHandlerRef = useRef<((event: ErrorEvent) => void) | null>(null)
  const messageErrorHandlerRef = useRef<((event: MessageEvent) => void) | null>(
    null
  )

  useEffect(() => {
    if (isSupported) {
      workerRef.current = new Worker(new URL(path, import.meta.url), options)
    } else {
      console.error("Web Workers are not supported in this environment.")
    }

    return () => {
      workerRef.current?.terminate()
      workerRef.current = null
    }
  }, [path, options, isSupported])

  const postMessage = useCallback(
    (message: unknown, transfer: Transferable[] = []) => {
      if (!workerRef.current) {
        throw new Error(
          "Worker not initialized or Web Workers are not supported."
        )
      }
      workerRef.current.postMessage(message, transfer)
    },
    []
  )

  const onMessage = useCallback((callback: (event: MessageEvent) => void) => {
    messageHandlerRef.current = callback
  }, [])

  const onError = useCallback((callback: (event: ErrorEvent) => void) => {
    errorHandlerRef.current = callback
  }, [])

  const onMessageError = useCallback(
    (callback: (event: MessageEvent) => void) => {
      messageErrorHandlerRef.current = callback
    },
    []
  )

  useEffect(() => {
    const worker = workerRef.current
    if (!worker) return

    const handleMessage = (event: MessageEvent) => {
      messageHandlerRef.current?.(event)
    }

    const handleError = (event: ErrorEvent) => {
      errorHandlerRef.current?.(event)
    }

    const handleMessageError = (event: MessageEvent) => {
      messageErrorHandlerRef.current?.(event)
    }

    worker.addEventListener("message", handleMessage)
    worker.addEventListener("error", handleError)
    worker.addEventListener("messageerror", handleMessageError)

    return () => {
      worker.removeEventListener("message", handleMessage)
      worker.removeEventListener("error", handleError)
      worker.removeEventListener("messageerror", handleMessageError)
    }
  }, [])

  return {
    postMessage,
    onMessage,
    onError,
    onMessageError,
    isSupported,
  }
}

export default useWebWorker
