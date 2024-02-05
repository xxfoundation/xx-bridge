import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react'
import useUpdatedRef from '@/hooks/useUpdatedRef.ts'

type Serializable = string | number | boolean | null | any[] | object

const ensureKeyInObject = (oldObj: any, newObj: any): any => {
  if (typeof oldObj !== 'object' && typeof newObj === typeof oldObj) {
    return oldObj
  }

  const mergedObj = Array.isArray(newObj) ? [...newObj] : { ...newObj }

  if (oldObj === null) {
    return mergedObj
  }

  Object.keys(oldObj).forEach((key: string) => {
    if (Object.prototype.hasOwnProperty.call(newObj, key)) {
      // if both objects have the same key, merge the values recursively
      mergedObj[key] = ensureKeyInObject(oldObj[key], newObj[key])
    } else {
      // if only the old object has the key, copy the value from the old object
      mergedObj[key] = oldObj[key]
    }
  })
  return mergedObj
}

const byteSize = (str: string) => new Blob([str]).size

function saveObjectToStorage<T extends Serializable | undefined>(
  storage: Storage,
  key: string,
  obj: T
): {
  size: number
  value: T
} {
  if (obj === undefined) {
    storage.removeItem(key)
    return {
      size: 0,
      value: obj
    }
  }

  const stringifiedObj = JSON.stringify(obj)
  storage.setItem(key, stringifiedObj)

  return {
    size: byteSize(stringifiedObj),
    value: obj
  }
}

/* type UseStorage<T extends Serializable> = [keyName: string, defaultValue?: T]

function useStorage<T extends Serializable>(
  keyName: string,
  defaultValue?: T
): [value: T, setValue: (v: T) => void] */
function useStorage<T extends Serializable>(
  storage: Storage,
  keyName: string
): [
  value: T | undefined,
  setValue: Dispatch<SetStateAction<T | undefined>>,
  size: number
]
function useStorage<T extends Serializable>(
  storage: Storage,
  keyName: string,
  defaultValue: T
): [value: T, setValue: Dispatch<SetStateAction<T>>, size: number]
function useStorage<T extends Serializable>(
  storage: Storage,
  keyName: string,
  defaultValue?: T
): [
  value: T | undefined,
  setValue: Dispatch<SetStateAction<T | undefined>>,
  size: number
] {
  const initialDefaultValueRef = useRef(defaultValue)

  const [storedValue, setStoredValue] = useState<{
    size: number
    value: T | undefined
  }>(() => {
    try {
      const value = storage.getItem(keyName)

      if (value) {
        const parsedValue = JSON.parse(value)
        if (initialDefaultValueRef.current !== undefined) {
          const mergedValue = ensureKeyInObject(
            parsedValue,
            initialDefaultValueRef.current
          )
          return saveObjectToStorage<T>(storage, keyName, mergedValue)
        }
        return {
          size: byteSize(value),
          value: parsedValue as T
        }
      }

      if (initialDefaultValueRef.current !== undefined) {
        return saveObjectToStorage<T>(
          storage,
          keyName,
          initialDefaultValueRef.current
        )
      }

      return {
        size: 0,
        value: undefined
      }
    } catch (err) {
      console.warn(err)
      return {
        size:
          initialDefaultValueRef.current === undefined
            ? 0
            : byteSize(JSON.stringify(initialDefaultValueRef.current)),
        value: initialDefaultValueRef.current
      }
    }
  })
  const storedValueRef = useUpdatedRef(storedValue, false)

  const onStorage = useCallback(
    (evt: StorageEvent) => {
      /**
       * Filter out events from other storage instances (so session storage events
       * don't trigger this handler on local storage hooks and vice versa).
       */
      if (evt.storageArea !== storage) {
        return
      }

      const value = storage.getItem(keyName)
      if (value !== null) {
        // if LocalStorage still has a value for this key, update the state
        try {
          const parsed = JSON.parse(value)
          setStoredValue({
            size: byteSize(value),
            value: parsed
          })
        } catch (e) {
          console.error(e)
          // probably a string
          if (typeof initialDefaultValueRef.current === 'string') {
            // if T is string, we can try to recover from this error
            // by setting the value to the string, but we save it again
            // to make sure it's going to be saved as a quoted string,
            // not as a raw string, so the next time we read it, it's
            // going to be parsed correctly
            console.warn(
              `Assuming that the non-JSON-parsable value in storage for key ${keyName} is a string: ${value}... This shouldn't be happening unless it was set manually in the browser dev tools or in a browser API call somewhere else that was not in this hook. Values should always be valid JSON, so strings should always be quoted and escaped (JSON.stringify).`
            )
            setStoredValue(saveObjectToStorage<T>(storage, keyName, value as T))
          } else if (initialDefaultValueRef.current !== undefined) {
            // There was an error parsing the value, but we have a default value,
            // so we save it to storage and set the state to it
            setStoredValue(
              saveObjectToStorage<T>(
                storage,
                keyName,
                initialDefaultValueRef.current
              )
            )
          } else {
            // If this hook is not being used with strings (therefore, we can't
            // recover from the error by assuming the raw string was the intended
            // string value), and we don't have a default value, throw the error again
            throw e
          }
        }
      } else if (initialDefaultValueRef.current !== undefined) {
        // if LocalStorage doesn't have a value for this key anymore, but we have
        // a default value, save it to storage and set the state
        setStoredValue(
          saveObjectToStorage<T>(
            storage,
            keyName,
            initialDefaultValueRef.current
          )
        )
      } else {
        setStoredValue({
          size: 0,
          value: undefined
        })
      }
    },
    [storage, keyName]
  )

  useEffect(() => {
    window.addEventListener('storage', onStorage)

    return () => window.removeEventListener('storage', onStorage)
  }, [onStorage])

  const setValue: Dispatch<SetStateAction<T | undefined>> = useCallback(
    newValue => {
      try {
        const oldValue = storedValueRef.current

        if (typeof newValue === 'function') {
          newValue = newValue(oldValue?.value)
        }

        const newStoredValue = saveObjectToStorage<T | undefined>(
          storage,
          keyName,
          // newValue is not a function anymore because we already
          // called it in the previous if statement
          newValue as Exclude<typeof newValue, Function>
        )
        storedValueRef.current = newStoredValue
        const event = new StorageEvent('storage', {
          key: keyName,
          newValue:
            newValue === undefined ? undefined : JSON.stringify(newValue),
          oldValue:
            oldValue?.value === undefined
              ? undefined
              : JSON.stringify(oldValue?.value),
          url: window.location.href,
          storageArea: storage
        })
        window.dispatchEvent(event)
      } catch (err) {
        console.error(err)
      }
    },
    [storedValueRef, storage, keyName]
  )

  return [storedValue.value, setValue, storedValue.size]
}

export default useStorage
