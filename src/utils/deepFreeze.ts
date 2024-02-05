import { DeepReadonly } from '@typeUtils'

function deepFreezeRecursive<T>(
  obj: T,
  circularReferencesSet: Set<any>
): DeepReadonly<T> {
  if (obj === null || obj === undefined || circularReferencesSet.has(obj)) {
    return obj as DeepReadonly<T>
  }
  circularReferencesSet.add(obj)
  ;(Object.keys(obj) as (keyof T)[]).forEach(prop => {
    deepFreezeRecursive(obj[prop], new Set())
  })

  return Object.freeze(obj) as DeepReadonly<T>
}

function deepFreeze<T>(obj: T): DeepReadonly<T> {
  return deepFreezeRecursive(obj, new Set())
}

export default deepFreeze
