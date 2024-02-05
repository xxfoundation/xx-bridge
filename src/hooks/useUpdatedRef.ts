import { MustBeBooleanLiteral } from '@typeUtils'
import { MutableRefObject, useEffect, useRef } from 'react'

function useUpdatedRefGeneric<T, ClearOnUnmount extends boolean>(
  value: T,
  clearOnUnmount: MustBeBooleanLiteral<ClearOnUnmount>
): MutableRefObject<ClearOnUnmount extends false ? T : T | undefined> {
  type RetType = ClearOnUnmount extends false ? T : T | undefined

  const ref = useRef<RetType>(value as RetType)
  useEffect(() => {
    ref.current = value as RetType
    if (clearOnUnmount) {
      return () => {
        ref.current = undefined as RetType
      }
    }
    return () => {}
  }, [value, clearOnUnmount])

  return ref
}

function useUpdatedRef<T>(value: T, clearOnOnmount: false): MutableRefObject<T>
function useUpdatedRef<T>(
  value: T,
  clearOnOnmount?: true
): MutableRefObject<T | undefined>

function useUpdatedRef<T>(
  value: T,
  clearOnUnmount: true | false = true
): MutableRefObject<T | undefined> | MutableRefObject<T> {
  return useUpdatedRefGeneric<T, typeof clearOnUnmount>(
    value,
    clearOnUnmount as never
  )
}

export default useUpdatedRef
