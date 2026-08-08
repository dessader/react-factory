"use client";

import { Component, useState } from "react";
import { createContext } from "@react-factory/create-context";

import type { ReactNode } from "react";

// Naming: `host` ("Counter") is a plain string, named in the thrown
// error message when a consumer reads this without a matching Provider.
// `ContextType` must extend `object | null`, so even a single number
// lives inside an object.
const [CounterContextProvider, useCounterContext] = createContext<{
  count: number;
}>("Counter");

const CounterReadout = () => (
  <span>{useCounterContext("CounterReadout").count}</span>
);

export const CounterDemo = () => {
  // Starts at 0 on purpose: the guard checks `contextValue !==
  // undefined`, not truthiness, so a falsy property inside the object
  // (`count: 0`) reads back exactly as passed.
  const [count, setCount] = useState(0);

  return (
    <CounterContextProvider
      value={{
        count,
      }}
    >
      <div className='row'>
        <button type='button' onClick={() => setCount((value) => value + 1)}>
          Increment
        </button>
        <CounterReadout />
      </div>
    </CounterContextProvider>
  );
};

// defaultValue: passed as the second argument, it becomes the fallback
// `React.createContext` uses when nothing wraps a consumer. A context
// created this way can never throw.
const [ThemeContextProvider, useThemeContext] = createContext<{
  mode: "light" | "dark";
}>("Theme", {
  mode: "light",
});

const ThemeReadout = () => {
  const { mode } = useThemeContext("ThemeReadout");
  return <span data-tone={mode === "dark" ? "accent" : "muted"}>{mode}</span>;
};

export const ThemeDemo = () => {
  const [mode, setMode] = useState<"light" | "dark">("light");

  return (
    <ThemeContextProvider
      value={{
        mode,
      }}
    >
      <div className='row'>
        <button
          type='button'
          onClick={() =>
            setMode((value) => (value === "light" ? "dark" : "light"))
          }
        >
          Toggle theme
        </button>
        <ThemeReadout />
      </div>
    </ThemeContextProvider>
  );
};

// Same ThemeContextProvider, read with no Provider at all: it falls back to
// `{ mode: "light" }` — the defaultValue from creation — instead of
// throwing.
export const ThemeDefaultDemo = () => {
  const { mode } = useThemeContext("ThemeDefaultDemo");
  return <span data-tone={mode === "dark" ? "accent" : "muted"}>{mode}</span>;
};

// optional: CounterContextProvider has no defaultValue, so reading it with no
// Provider normally throws. Passing `{ optional: true }` reads back
// `undefined` instead.
export const OptionalDemo = () => {
  const value = useCounterContext("OptionalDemo", {
    optional: true,
  });
  return <span>{value === undefined ? "no Provider" : value.count}</span>;
};

// Missing Provider: reading CounterContextProvider with no Provider and no
// `optional` flag throws instead of silently returning `undefined`. The
// error is caught here purely so the message renders on the page instead
// of crashing it.
const UnwrappedCounter = () => (
  <span>{useCounterContext("UnwrappedCounter").count}</span>
);

class CaughtError extends Component<
  {
    children: ReactNode;
  },
  {
    message: string | null;
  }
> {
  override state = {
    message: null as string | null,
  };

  static getDerivedStateFromError(error: unknown) {
    return {
      message: error instanceof Error ? error.message : String(error),
    };
  }

  override render() {
    return this.state.message ? (
      <code>{this.state.message}</code>
    ) : (
      this.props.children
    );
  }
}

export const MissingProviderDemo = () => {
  const [triggered, setTriggered] = useState(false);

  if (!triggered) {
    return (
      <button type='button' onClick={() => setTriggered(true)}>
        Read useCounterContext() without a Provider
      </button>
    );
  }

  return (
    <CaughtError>
      <UnwrappedCounter />
    </CaughtError>
  );
};

// Multiple contexts: CounterContextProvider and ThemeContextProvider come from separate
// createContext calls, so nesting one Provider inside the other never
// leaks a value from one into the other's hook.
export const MultipleContextsDemo = () => (
  <CounterContextProvider
    value={{
      count: 7,
    }}
  >
    <ThemeContextProvider
      value={{
        mode: "dark",
      }}
    >
      <div className='row'>
        <CounterReadout />
        <ThemeReadout />
      </div>
    </ThemeContextProvider>
  </CounterContextProvider>
);
