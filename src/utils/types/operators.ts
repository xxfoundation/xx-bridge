/* eslint-disable @typescript-eslint/naming-convention */
import { AnyFunction, Primitives } from './basics.ts'

export type IsAny<T, True = true, False = false> = Extends<
  0,
  1 & T,
  True,
  False
>
export type IsNever<T, True = true, False = false> = Extends<
  [T],
  [never],
  True,
  False
>
export type IsUnknown<T, True = true, False = false> = If<
  Or<[IsAny<T>, IsNever<T>]>,
  False,
  ExtendsBothWays<T, unknown, True, False>
>
export type IsNull<T, True = true, False = false> = If<
  IsNever<T>,
  False,
  ExtendsBothWays<T, null, True, False>
>
export type IsUndefined<T, True = true, False = false> = If<
  IsNever<T>,
  False,
  ExtendsBothWays<T, undefined, True, False>
>
export type IsNeverArray<T, True = true, False = false> = ExtendsBothWays<
  T,
  never[],
  True,
  False
>
export type IsVoid<T, True = true, False = false> = Or<
  [IsUndefined<T>, IsNever<T>],
  False,
  Extends<T, void, True, False>
>
export type IsFunction<T, True = true, False = false> = If<
  IsAny<T>,
  False,
  T extends AnyFunction ? True : False
>

export type IsPrimitive<T, True = true, False = false> = If<
  Or<[IsAny<T>, IsNever<T>]>,
  False,
  Extends<T, Primitives, True, False>
>
export type IsString<T, True = true, False = false> = If<
  IsAny<T>,
  False,
  Extends<T, string, True, False>
>
export type IsStringLiteral<T, True = true, False = false> = _IsLiteral<
  T,
  string,
  True,
  False
>
export type IsNumber<T, True = true, False = false> = If<
  IsAny<T>,
  False,
  Extends<T, number, True, False>
>
export type IsNumberLiteral<T, True = true, False = false> = _IsLiteral<
  T,
  number,
  True,
  False
>
export type IsBoolean<T, True = true, False = false> = If<
  IsAny<T>,
  False,
  Extends<T, boolean, True, False>
>
export type IsBooleanLiteral<T, True = true, False = false> = _IsLiteral<
  T,
  boolean,
  True,
  False
>
export type IsBigInt<T, True = true, False = false> = If<
  IsAny<T>,
  False,
  Extends<T, bigint, True, False>
>
export type IsBigIntLiteral<T, True = true, False = false> = _IsLiteral<
  T,
  bigint,
  True,
  False
>
export type IsSymbol<T, True = true, False = false> = If<
  IsAny<T>,
  False,
  Extends<T, symbol, True, False>
>
export type IsSymbolLiteral<T, True = true, False = false> = _IsLiteral<
  T,
  symbol,
  True,
  False
>
export type IsLiteral<T, True = true, False = false> = Or<
  [
    IsStringLiteral<T>,
    IsNumberLiteral<T>,
    IsBooleanLiteral<T>,
    IsBigIntLiteral<T>,
    IsSymbolLiteral<T>
  ],
  True,
  False
>

export type MustBeAny<T> = If<IsAny<T>, T, never>
export type MustBeUnknown<T> = If<IsUnknown<T>, T, never>
export type MustBeNull<T> = If<IsNull<T>, T, never>
export type MustBeUndefined<T> = If<IsUndefined<T>, T, never>
export type MustBeVoid<T> = If<IsVoid<T>, T, never>
export type MustBeFunction<T> = If<IsFunction<T>, T, never>
export type MustBePrimitive<T> = If<IsPrimitive<T>, T, never>
export type MustBeString<T> = If<IsString<T>, T, never>
export type MustBeStringLiteral<T> = If<IsStringLiteral<T>, T, never>
export type MustBeNumber<T> = If<IsNumber<T>, T, never>
export type MustBeNumberLiteral<T> = If<IsNumberLiteral<T>, T, never>
export type MustBeBoolean<T> = If<IsBoolean<T>, T, never>
/**
 * function exampleFunction<T extends boolean>(value: MustBeBooleanLiteral<T>) {
 *   // Implementation...
 *   console.log(value);
 * }
 *
 * exampleFunction(true);  // Valid
 * exampleFunction(false); // Valid
 * exampleFunction(Math.random() < 0.5) // Type error (boolean is not assignable to never)
 */
export type MustBeBooleanLiteral<T> = If<IsBooleanLiteral<T>, T, never>
export type MustBeBigInt<T> = If<IsBigInt<T>, T, never>
export type MustBeBigIntLiteral<T> = If<IsBigIntLiteral<T>, T, never>
export type MustBeSymbol<T> = If<IsSymbol<T>, T, never>
export type MustBeSymbolLiteral<T> = If<IsSymbolLiteral<T>, T, never>
export type MustBeLiteral<T> = If<IsLiteral<T>, T, never>

export type If<C extends boolean, True, False> = C extends true ? True : False
export type And<
  Args extends [any, any, ...any[]],
  True = true,
  False = false
> = Args extends [...boolean[]] ? _And<Args, True, False> : never
export type Or<
  Args extends [any, any, ...any[]],
  True = true,
  False = false
> = Args extends [...boolean[]] ? _Or<Args, True, False> : never
export type Not<C extends boolean, True = true, False = false> = C extends true
  ? False
  : True

export type DefaultIfNever<T, Default> = IsNever<T, Default, T>

export type IterateTuple<
  T extends [...any],
  IfEmpty,
  IfOnlyHead,
  IfHasTail = IfOnlyHead
> = T['length'] extends 0
  ? IfEmpty
  : T['length'] extends 1
    ? IfOnlyHead
    : IfHasTail

export type Extends<A, B, True = true, False = false> = A extends B
  ? True
  : False
export type ExtendsBothWays<A, B, True = true, False = false> = __And<
  Extends<A, B>,
  Extends<B, A>,
  True,
  False
>

// ---- INTERNAL TYPES ---- //

// Whether T is a literal of type L
type _IsLiteral<T, L, True = true, False = false> = If<
  IsNever<T>,
  False,
  Extends<T, L, Extends<L, T, False, True>, False>
>

type LiteralBoolOrNever<T extends boolean> = boolean extends T ? never : T

type __And<
  A extends boolean,
  B extends boolean,
  True = true,
  False = false
> = IsNever<
  LiteralBoolOrNever<A>,
  never,
  IsNever<
    LiteralBoolOrNever<B>,
    never,
    A extends true ? (B extends true ? True : False) : False
  >
>

type _And<
  Args extends [boolean, ...boolean[]],
  True = true,
  False = false
> = Args['length'] extends 0
  ? // This type doesn't allow an empty tuple
    never
  : Args['length'] extends 1
    ? Args[0]
    : Args['length'] extends 2
      ? __And<Args[0], Args[1], True, False>
      : Args extends [boolean, boolean, ...infer Tail]
        ? Tail extends boolean[]
          ? // Recurse
            _And<[__And<Args[0], Args[1]>, ...Tail], True, False>
          : // This never happens because Tail is always a boolean[]
            __And<Args[0], Args[1], True, False>
        : // This never happens because, if Args['length']>2, then Args extends [boolean, boolean, ...boolean[]]
          never

type __Or<
  A extends boolean,
  B extends boolean,
  True = true,
  False = false
> = IsBooleanLiteral<
  A,
  // A is literal
  A extends true
    ? // `A === true`, and `true | boolean === true`
      True
    : IsBooleanLiteral<
        B,
        // both are literal; do the OR
        B extends true ? True : False,
        // OR of two booleans is unknown, so this isn't allowed
        never
      >,
  // A is not literal
  IsBooleanLiteral<
    B,
    // B is literal
    B extends true
      ? // `B === true`, and `boolean | true === true`
        True
      : // `B === false`, and `boolean | false === boolean`, so this isn't allowed
        never,
    // OR of two booleans is unknown, so this isn't allowed
    never
  >
>

type _Or<Args extends [boolean, ...boolean[]], True = true, False = false> =
  // This type doesn't allow an empty tuple as a starting point
  Args['length'] extends 0
    ? never
    : // If there is only one element, and it's literal, return it; else result can't be determined
      Args['length'] extends 1
      ? IsBooleanLiteral<Args[0], Args[0] extends true ? True : never, never>
      : // If there are only two elements, do a normal OR and don't recurse
        Args['length'] extends 2
        ? __Or<Args[0], Args[1], True, False>
        : // If there are more than two elements
          Args extends [boolean, boolean, ...infer Tail]
          ? // If the first two are enough to determine the result, then we're done
            DefaultIfNever<
              __Or<
                Args[0],
                Args[1],
                True,
                // Not enough to determine the result, so continue
                never
              >,
              // The first two weren't enough to determine the result
              Tail extends boolean[]
                ? Tail['length'] extends 0
                  ? // Tail is empty and no result was determined, so return never
                    never
                  : // Tail is not empty and no result was determined, so recurse
                    _Or<[__Or<Args[0], Args[1]>, ...Tail], True, False>
                : // This never happens because Tail is always a boolean[]
                  __Or<Args[0], Args[1], True, False>
            >
          : // This never happens because, if Args['length']>2, then Args extends [boolean, boolean, ...boolean[]]
            never
