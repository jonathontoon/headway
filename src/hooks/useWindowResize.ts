import { useEffect, useCallback } from 'react'

const useWindowResize = (callback: () => void) => {
  const handleResize = useCallback(() => {
    callback()
  }, [callback])

  useEffect(() => {
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [handleResize])
}

export default useWindowResize
