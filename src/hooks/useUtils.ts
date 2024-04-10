import { useEffect, useRef } from 'react'

const usePrevious = (value: any, initialValue: any) => {
  const ref = useRef(initialValue)
  useEffect(() => {
    ref.current = value
  })
  return ref.current
}
// Used to debug useEffect dependencies
// replace useEffect with useEffectDebugger and pass in the dependencies and their names
/* Example:
 * useEffectDebugger(() => {
 *  console.log('effect')
 * }, [data, error], ['data', 'error'])
 */
const useEffectDebugger = (
  effectHook: React.EffectCallback,
  dependencies: any[] | React.DependencyList | undefined,
  dependencyNames = []
) => {
  const previousDeps = usePrevious(dependencies, [])

  const changedDeps = dependencies?.reduce(
    (accum: any, dependency: any, index: string | number) => {
      if (dependency !== previousDeps[index]) {
        const keyName = dependencyNames[Number(index)] || index
        return {
          ...accum,
          [keyName]: {
            before: previousDeps[index],
            after: dependency
          }
        }
      }

      return accum
    },
    {}
  )

  if (Object.keys(changedDeps).length) {
    console.log('[use-effect-debugger] ', changedDeps)
  }

  useEffect(effectHook, dependencies)
}

const useDebounce = (
  callback: (...args: any) => void,
  delay: number | undefined
) => {
  // This function is what you will call instead of the direct callback
  const timeoutRef = useRef<NodeJS.Timeout | undefined>()

  const debouncedFunction = (...args: any[]) => {
    // Clear the existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set a new timeout
    timeoutRef.current = setTimeout(() => {
      callback(...args)
    }, delay)
  }

  // Cleanup function to be used in useEffect
  const cancel = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }

  return [debouncedFunction, cancel]
}

export { useEffectDebugger, usePrevious, useDebounce }
