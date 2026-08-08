<img src="../../.github/assets/create-context.png" alt="React Factory" width="100%" />

# 📦 @react-factory/create-context

[Motivation](#motivation) • [Get Started](#get-started) • [Examples](#examples) • [API](#api)

A tiny factory for creating a React context and providing convenient access to it.

- 🪶 **Zero dependencies and minimal size** – less than 0.3 KB gzipped
- 🛡️ **Type-safe** – infers automatically, or takes an explicit generic when you want full control. The hook's return type shifts per call form via overloads, not one catch-all type

> ⚛️ **Requires React 18 or later.**

## Motivation

Setting up a context in React often means writing the same boilerplate: call `createContext`, write a hook that calls `useContext`, and then add a guard so consumers fail with a clear error instead of silently reading `undefined` when someone forgets the Provider. This library solves this problem by providing a tiny utility that resolves the issue once and for all.

## Get Started

### Installation

```bash
npm install @react-factory/create-context
```

### Usage

```tsx
import { createContext } from "@react-factory/create-context";

type CounterValue = { count: number };

const [CounterContextProvider, useCounterContext] =
  createContext<CounterValue>("Counter");
```

`createContext` returns a tuple: a `Provider` component, and a hook that
reads it. See [Examples](#examples) for how to render and read it, and
[API](#api) for the full reference.

> ℹ️ **About context naming**
>
> By default, the factory adds the suffix `ContextProvider` to the host name, `createContext<...>("Counter")` turn into `CounterContextProvider` in debug errors. We recommend extracting providers from the tuple returned by the factory using this exact naming convention, because it clearly conveys the component purpose. At this time, hostname transforming is a "by design" feature of the factory and cannot be configured. A future release will introduce the `transformContextName` option, which will allow for flexible control over this behavior.
>
> Example: `const [<HostName>ContextProvider, use<HostName>Context] = createContext<...>("Counter");`

## Examples

### Naming and reading from a Provider

```tsx
import { createContext } from "@react-factory/create-context";

type CounterValue = { count: number };

const [CounterContextProvider, useCounterContext] =
  createContext<CounterValue>("Counter");

const Counter = () => (
  <CounterContextProvider value={{ count: 1 }}>
    <CounterReadout />
  </CounterContextProvider>
);

const CounterReadout = () => {
  const { count } = useCounterContext("CounterReadout");
  return <span>{count}</span>;
};
```

With no `defaultValue`, `ContextType` has nothing to infer from, so it's
passed explicitly. Reading `useCounterContext` outside `<CounterContextProvider>`
throws, naming both `CounterReadout` (who asked) and `Counter` (where the
Provider belongs).

### `defaultValue`

```tsx
import { createContext } from "@react-factory/create-context";

const [ThemeContextProvider, useThemeContext] = createContext("Theme", {
  mode: "light",
});

const ThemeReadout = () => {
  const { mode } = useThemeContext("ThemeReadout");
  return <span>{mode}</span>;
};

// No <ThemeContextProvider> above it anywhere, and it still resolves:
<ThemeReadout />;
```

`ContextType` infers straight from `defaultValue` here (`{ mode: string }`),
no generic written. A context created with a fallback never throws; the
reader above falls back to `{ mode: "light" }`.

### `optional`

```tsx
import { createContext } from "@react-factory/create-context";

type CounterValue = { count: number };

const [CounterContextProvider, useCounterContext] =
  createContext<CounterValue>("Counter");

const CounterReadout = () => {
  const value = useCounterContext("CounterReadout", { optional: true });
  return <span>{value === undefined ? "no counter yet" : value.count}</span>;
};

// No <CounterContextProvider> above it, and it still resolves, to `undefined`:
<CounterReadout />;
```

`{ optional: true }` only exists on contexts created without
`defaultValue`. With one, there's nothing left to opt out of.

## API

### `createContext<ContextType>(host)`

Creates a context with no fallback. Reading it outside a matching
Provider throws.

| Parameter     | Type          | Description                                                                                                                                           |
| ------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ContextType` | type argument | The value type held by the context. Must extend `object \| null`. Pass it explicitly here; there's nothing to infer it from without a `defaultValue`. |
| `host`        | `string`      | Name of the component that owns this context. Appears in the thrown error message.                                                                    |

Returns `readonly [ComponentType<CreateContextFactoryProviderProps<ContextType>>, CreateContextFactoryUseContext<ContextType>]`.
`CreateContextFactoryUseContext` accepts `{ optional: true }` on top of
the throwing form; see
[the returned hook](#the-returned-hook-usecontextconsumer-options) below.

### `createContext<ContextType>(host, defaultValue)`

Creates a context with a fallback. Reading it outside a matching Provider
returns `defaultValue` instead of throwing.

| Parameter      | Type          | Description                                                                                                     |
| -------------- | ------------- | --------------------------------------------------------------------------------------------------------------- |
| `ContextType`  | type argument | The value type held by the context. Infers from `defaultValue`.                                                 |
| `host`         | `string`      | Name of the component that owns this context. Never reaches the error message, since this overload can't throw. |
| `defaultValue` | `ContextType` | Returned by the hook when no Provider is found.                                                                 |

Returns `readonly [ComponentType<CreateContextFactoryProviderProps<ContextType>>, CreateContextFactoryUseAssertedContext<ContextType>]`.
No `{ optional: true }` option, because `defaultValue` is explicitly defined.

### The returned Provider component: `<Provider value={value}>{children}</Provider>`

| Prop       | Type          | Description                                        |
| ---------- | ------------- | -------------------------------------------------- |
| `value`    | `ContextType` | The value consumers below this Provider will read. |
| `children` | `ReactNode`   | The subtree that reads `value`.                    |

`value` is always `ContextType`, never `ContextType | undefined`, on both
overloads. A Provider can never be told to explicitly supply "missing" as
a value, even on a context created with a `defaultValue`.

### The returned hook: `useContext(consumer, options?)`

| Parameter          | Type      | Description                                                                                                                                                                 |
| ------------------ | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `consumer`         | `string`  | Name of the component calling the hook. Appears in the thrown error message.                                                                                                |
| `options.optional` | `boolean` | When `true`, resolves to `undefined` instead of throwing. Only typed on contexts created without `defaultValue`, since a context with a fallback has nothing to opt out of. |
