export type Primitives = string | number | boolean | symbol | bigint

export type AnyKey = keyof any

export type AnyFunction = (...args: any[]) => any

export interface Constructor<T, CArgs extends any[] = []> {
  new (...args: CArgs): T
  readonly prototype: T
}

export type AnyObject = Record<AnyKey, any>

export type Serializable = string | number | boolean | null | any[] | object
