import { AnyObject } from '@typeUtils'
import { DeepReadonly } from '@/utils/types'

function pick<O extends DeepReadonly<AnyObject>, P extends keyof O>(
  obj: O,
  keys: readonly [...P[]]
): Pick<O, P> {
  const ret = {} as Pick<O, P>

  keys.forEach(key => {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      ret[key] = obj[key]
    }
  })

  return ret
}

export default pick
