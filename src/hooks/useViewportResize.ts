import { useEffect, useCallback } from 'react'

const useViewportResize = (callback: (event: Event) => void) => {
  const handleResize = useCallback(
    (event: Event) => {
      callback(event)
    },
    [callback],
  )

  useEffect(() => {
    window.visualViewport?.addEventListener('resize', handleResize)
    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize)
    }
  }, [handleResize])
}

export default useViewportResize
