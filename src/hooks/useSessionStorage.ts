import type { Dispatch, SetStateAction } from 'react'
import useStorage from '@/hooks/useStorage'
import type { Serializable } from '@/utils/types'

function useSessionStorage<T extends Serializable>(
  keyName: string
): [
  value: T | undefined,
  setValue: Dispatch<SetStateAction<T | undefined>>,
  size: number
]
function useSessionStorage<T extends Serializable>(
  keyName: string,
  defaultValue: T
): [value: T, setValue: Dispatch<SetStateAction<T>>, size: number]
function useSessionStorage<T extends Serializable>(
  keyName: string,
  defaultValue?: T
): [
  value: T | undefined,
  setValue: Dispatch<SetStateAction<T | undefined>>,
  size: number
] {
  return useStorage(window.sessionStorage, keyName, defaultValue as T) as any
}

export default useSessionStorage
