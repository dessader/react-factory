import type { ComponentType, ReactNode } from "react";

/**
 * Options accepted by the hook returned from `createContext`.
 */
export type CreateContextFactoryUseContextOptions = {
  /**
   * When `true`, a missing Provider resolves to `undefined` instead of
   * throwing.
   */
  optional?: boolean;
};

/**
 * Props accepted by the `Provider` component returned from
 * `createContext`. `value` is always `ContextType`, never
 * `ContextType | undefined`, regardless of whether the context has a
 * `defaultValue` a real Provider should never be able to supply
 * "missing" as a value.
 *
 * @typeParam ContextType - The value type held by the context.
 */
export type CreateContextFactoryProviderProps<ContextType> = {
  value: ContextType;
  children?: ReactNode;
};

/**
 * The hook type returned by `createContext` when no `defaultValue` was
 * given at creation. Reading it with no matching Provider in the tree
 * throws. Pass `{ optional: true }` and it resolves to `undefined`
 * instead.
 *
 * @typeParam ContextType - The value type held by the context.
 */
export type CreateContextFactoryUseContext<ContextType> = {
  /**
   * Reads the current context value. Throws when called outside the
   * matching Provider.
   *
   * @param consumer - Name of the component calling the hook, named in the thrown error message.
   */
  (consumer: string): ContextType;
  /**
   * Reads the current context value without throwing, even with no
   * matching Provider.
   *
   * @param consumer - Name of the component calling the hook, kept so both call forms share a signature.
   * @param options - Pass `{ optional: true }` to opt out of the throw.
   */
  (consumer: string, options: { optional: true }): ContextType | undefined;
};

/**
 * The hook type returned by `createContext` when a `defaultValue` was
 * given at creation. A value is always available, from a Provider or from
 * `defaultValue`, so reading it never throws and there's no `optional`
 * form to opt out with.
 *
 * @typeParam ContextType - The value type held by the context.
 */
export type CreateContextFactoryUseAssertedContext<ContextType> = {
  /**
   * Reads the current context value. Never throws and never resolves to
   * `undefined`, since `defaultValue` guarantees one.
   *
   * @param consumer - Name of the component calling the hook, kept for signature parity with `CreateContextFactoryUseContext`.
   */
  (consumer: string): ContextType;
};

/**
 * The type of `createContext` itself. Two call signatures, picked by
 * whether `defaultValue` is passed.
 *
 * Both return a `Provider` component owned by the factory.
 * `value` on that component is typed as `ContextType` in
 * both branches, never `ContextType | undefined` — a Provider can never
 * be told to explicitly supply "missing" as a value, even on a context
 * created with a `defaultValue`.
 */
export type CreateContextFactory = {
  /**
   * Creates a context with no fallback value: reading it outside a
   * matching Provider throws, or with `{ optional: true }`, resolves to
   * `undefined`.
   *
   * @typeParam ContextType - The value type held by the context.
   * @param host - Name of the component that owns this context, named in the thrown error message.
   */
  <ContextType extends object | null>(
    host: string,
  ): readonly [
    ComponentType<CreateContextFactoryProviderProps<ContextType>>,
    CreateContextFactoryUseContext<ContextType>,
  ];
  /**
   * Creates a context with a fallback value: reading it outside a
   * matching Provider resolves to `defaultValue` instead of throwing.
   *
   * @typeParam ContextType - The value type held by the context.
   * @param host - Name of the component that owns this context. Never appears in an error here, since this overload can't throw.
   * @param defaultValue - The hook returns this when no Provider is found.
   */
  <ContextType extends object | null>(
    host: string,
    defaultValue: ContextType,
  ): readonly [
    ComponentType<CreateContextFactoryProviderProps<ContextType>>,
    CreateContextFactoryUseAssertedContext<ContextType>,
  ];
};
