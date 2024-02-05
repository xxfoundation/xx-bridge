import { AnyKey, AnyObject, Primitives } from './basics'
import { And, IsNever, IterateTuple } from './operators'

export type Mutable<T> = T extends string | number | Function
  ? T
  : T extends readonly [...infer E]
    ? [...E]
    : {
        -readonly [K in keyof T]: T[K]
      }

export type DeepMutable<T> = T extends null | undefined | Primitives | Function
  ? T
  : // tuples
    T extends readonly [infer A, ...infer B]
    ? IterateTuple<
        [A, ...B],
        [],
        [DeepMutable<A>],
        [DeepMutable<A>, ...DeepMutable<B>]
      >
    : T extends ReadonlyArray<infer E>
      ? Array<DeepMutable<E>>
      : {
          -readonly [K in keyof T]: DeepMutable<T[K]>
        }

export type DeepReadonly<T> = T extends null | undefined | Primitives | Function
  ? T
  : T extends readonly [infer A, ...infer B]
    ? IterateTuple<
        [A, ...B],
        readonly [],
        readonly [DeepReadonly<A>],
        readonly [DeepReadonly<A>, ...DeepReadonly<B>]
      >
    : T extends ReadonlyArray<infer E>
      ? ReadonlyArray<DeepReadonly<E>>
      : {
          +readonly [K in keyof T]: DeepReadonly<T[K]>
        }

/**
 * Represents a type that transforms all properties of the given object type `T`
 * to be optionally `undefined`.
 *
 * This utility type takes an object type `T` and modifies each property to be
 * optional and only able to hold `undefined` as its value. It is useful for
 * creating types where you want to explicitly express that each property is
 * intentionally absent or undefined.
 *
 * @typeParam T - A record type with any set of properties.
 *
 * @example
 * // For a given type:
 * type Example = {
 *   a: number;
 *   b: string;
 * }
 *
 * // The EmptyObject<Example> type will be:
 * type EmptyExample = {
 *   a?: undefined;
 *   b?: undefined;
 * }
 */
export type EmptyObject<T extends Record<keyof any, unknown>> = {
  [K in keyof T]+?: undefined
}

/**
 * Represents a type that ensures all properties of the given object type `T`
 * are neither `null` nor `undefined`.
 *
 * @typeParam T - A record type with any set of properties.
 *
 * @example
 * // For a given type:
 * type Example = {
 *   a: number | null;
 *   b?: string;
 * }
 *
 * // The FullObject<Example> type will be:
 * type FullExample = {
 *   a: number;
 *   b: string;
 * }
 */
export type FullObject<T extends Record<keyof any, unknown>> = {
  [K in keyof T]-?: NonNullable<T[K]>
}

/**
 * Represents a type that is either an object with all properties of `T`
 * being non-nullable (neither null nor undefined) or an object where all
 * properties of type `T` are optional or undefined.
 *
 * This type is useful when an object should either have all its properties
 * fully defined or all of them should be absent/undefined.
 *
 * @typeParam T - A record type with any set of properties, including nullable
 * and undefineable properties.
 *
 * @example
 * // For a given type:
 * type Example = {
 *   a: number | null;
 *   b?: string;
 *   c: boolean | undefined;
 * }
 *
 * // The InitializableObject<Example> type will accept either:
 * // - An object where all properties are non-nullable:
 * //   { a: number, b: string, c: boolean }
 * // - Or an object where all properties are optional or undefined:
 * //   { a?: undefined, b?: undefined, c?: undefined }
 *
 * @see FullObject - For the type ensuring all properties are non-nullable.
 * @see EmptyObject - For the type ensuring all properties are optional and undefined.
 */
export type InitializableObject<T extends AnyObject> =
  | ({ inited: true } & FullObject<Omit<T, 'inited'>>)
  | ({ inited: false } & EmptyObject<Omit<T, 'inited'>>)

/**
 * Ensures that the given keys are the only and all keys of the given object type.
 * If they are, the type will be the given keys, otherwise it will be `never`.
 */
export type ExactKeysOrNever<
  K extends readonly [...AnyKey[]],
  O extends Readonly<AnyObject>
> = And<
  [IsNever<Exclude<K[number], keyof O>>, IsNever<Exclude<keyof O, K[number]>>],
  K,
  never
>
