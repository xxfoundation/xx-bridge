import { useEffect, useRef } from 'react'

export type MountedRef = React.MutableRefObject<boolean>

function useIsMountedRef(): MountedRef {
  const isMounted = useRef(false)

  useEffect((): (() => void) => {
    isMounted.current = true

    return (): void => {
      isMounted.current = false
    }
  }, [])

  return isMounted
}

export default useIsMountedRef
