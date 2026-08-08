"use client";

import * as React from "react";

import type {
  CreateContextFactory,
  CreateContextFactoryProviderProps,
  CreateContextFactoryUseContextOptions,
} from "./create-context.types";

/**
 * Creates a React context and provides a hook to access it.
 *
 * @typeParam TContextValue - The value type held by the context.
 * @param host - Name of the component that owns this context. `useContext` names it in the thrown error message.
 * @param defaultValue - Fallback used by `React.createContext` when no Provider is found.
 * @returns A `[Provider, useContext]` tuple.
 */
export const createContext: CreateContextFactory = <
  TContextValue extends object | null,
>(
  host: string,
  defaultValue?: TContextValue,
) => {
  const providerName = `${host}ContextProvider`;

  /**
   * The underlying React context. Kept private: callers never see it,
   * only the `Provider` component below reads and writes to it.
   */
  const Context = React.createContext<TContextValue | undefined>(defaultValue);

  /**
   * A custom Provider wrapping the raw `Context.Provider`.
   */
  const Provider = ({
    value,
    children,
  }: CreateContextFactoryProviderProps<TContextValue>) =>
    React.createElement(Context.Provider, { value }, children);

  Provider.displayName = providerName;

  /**
   * Reads `context` on every call and decides whether the result counts as
   * present or missing.
   *
   * @param consumer - Name of the component calling the hook. Appears in the thrown error message.
   * @param options - Pass `{ optional: true }` to get `undefined` back instead of a throw when nothing is found.
   * @returns The current context value, or `undefined` when nothing is found and `optional` is set.
   * @throws {Error} When nothing is found and `optional` is not set.
   */
  const useContext = (
    consumer: string,
    options?: CreateContextFactoryUseContextOptions,
  ) => {
    const { optional = false } = options ?? {};

    /**
     * The nearest Provider's value, or `defaultValue` if none is found,
     * or `undefined` if neither exists.
     */
    const contextValue = React.useContext(Context);

    /**
     * A value is present, from a Provider or from `defaultValue` baked
     * into `React.createContext`. Either source lands here, and the hook
     * returns it without asking which one it was.
     */
    if (contextValue !== undefined) return contextValue;

    /**
     * Nothing is present, and the caller passed `{ optional: true }`,
     * to avoid causing an exception due to a missing value in the context (silent exit).
     */
    if (optional) return;

    /**
     * Nothing is present, no fallback.
     */
    throw new Error(`${consumer} must be rendered within ${providerName}`);
  };

  return [Provider, useContext];
};
