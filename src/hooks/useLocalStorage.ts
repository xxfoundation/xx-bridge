import type { Dispatch, SetStateAction } from 'react'
import useStorage from '@/hooks/useStorage'
import type { Serializable } from '@/utils/types'

function useLocalStorage<T extends Serializable>(
  keyName: string
): [
  value: T | undefined,
  setValue: Dispatch<SetStateAction<T | undefined>>,
  size: number
]
function useLocalStorage<T extends Serializable>(
  keyName: string,
  defaultValue: T
): [value: T, setValue: Dispatch<SetStateAction<T>>, size: number]
function useLocalStorage<T extends Serializable>(
  keyName: string,
  defaultValue?: T
): [
  value: T | undefined,
  setValue: Dispatch<SetStateAction<T | undefined>>,
  size: number
] {
  return useStorage(window.localStorage, keyName, defaultValue as T) as any
}

export default useLocalStorage
