<img src=".github/assets/cover.png" alt="React Forge" width="100%" />

# React Forge

[Motivation](#motivation) • [Get Started](#get-started) • [Examples](#examples) • [Advanced](#advanced) • [API](#api) • [FAQ](#faq)

A lightweight factory for building type-safe, polymorphic React components.

- 🪶 **Zero dependencies and minimal size** – less than 1 KB gzipped
- 🔀 **Polymorphism support** – swap the root element with another DOM node or React component
- 🛡️ **Fully typed** – every component infers its prop types from the default root element, and also accounts for the props of whatever element or component is swapped in via the polymorphic prop
- 🔗 **Automatic ref forwarding** – `ref` is passed straight through to the resolved root, keeping components fully open for customization, direct DOM node access, and integration with third-party libraries
- ⚡ **SSR-ready & async-aware** – fully support for Server Components

> ⚛️ **Requires React 19 or later.**
>
> The library relies on passing `ref` as a plain prop and does not support `forwardRef`, since it's [deprecated](https://react.dev/reference/react/forwardRef). This is why only React 19 and above are supported.

## Motivation

Working across projects of very different scales, I kept running into the same handful of problems, over and over, each one requiring extra refactoring to work around:

- **Components didn't support their root DOM node's native props.** Most components only expose a narrow, hand-picked set of custom props instead of extending the standard interface of the element they render. The result: even basic things like `className`, `id`, or a `data-*` attribute were often impossible to pass down.
- **No `ref` forwarding to the root node.** This used to mean wrapping every component in `forwardRef`, which was already a chore. React 19 dropped that requirement, but the underlying problem didn't go away: most components still don't forward `ref` by default, which blocks integration with any third-party library that needs direct DOM access.
- **No flexible way to swap the root element.** This is often needed to keep markup semantically correct, and sometimes for trickier cases too. The most common example: using a button's visual styling while actually rendering it as a link.

React Forge grew out of that recurring friction. The goal was a single tool that encapsulates all of that logic, so you can just build components that support all of it out of the box: full type inference, polymorphism, `ref` handling, and one central abstraction you can adapt to your own needs.

## Get Started

### Installation

```bash
npm install @react-forge/core
```

### Usage

```tsx
import { createComponent } from "@react-forge/core";

type TextProps = {
  tone: string;
};

const Text = createComponent<TextProps>()({
  element: "p",
  Render: (Component, { tone, ...rest }) => (
    <Component data-tone={tone} {...rest} />
  ),
});

Text.displayName = "Text";

// Usage
<Text tone="accent" className="text-lg" />
<Text component="span" tone="muted" />
```

> See the [Advanced](#advanced) section for a recommended pattern once you're ready to use the factory across a whole codebase.

## Examples

_Coming soon._

## Advanced

### Local wrapper around the factory

Importing a third-party function directly into every file that needs it is a common source of pain down the line: any shared change, or a breaking change in the package itself, means touching every call site. The established pattern for external dependencies is to wrap them in a thin local facade that all of the source code references instead — a single source of truth where behavior can be adjusted, and the only place that needs to change when the package updates.

`createComponent` is a good candidate for exactly this treatment, and wrapping it locally is the recommended approach. Rather than importing it directly into every component file, wrap it once, and let every component in the app go through that single entry point — so app-wide defaults live in one file and can evolve without touching every call site:

```tsx
// lib/create-component.ts

import { createComponent as createComponentFactory } from "@react-forge/core";

import type { CreateComponentFactoryOptions } from "@react-forge/core";
import type { ElementType } from "react";

export const createComponent = <
  TCustomProps extends Record<string, unknown> = Record<never, never>,
>() => {
  const factory = createComponentFactory<TCustomProps>();

  return <
    TElement extends ElementType = "div",
    TPolymorphic extends boolean = true,
  >(
    options: CreateComponentFactoryOptions<TElement, TCustomProps> & {
      polymorphic?: TPolymorphic;
    },
  ) =>
    factory({
      // For example, for some reason, we want to enable memoization for all components.
      memo: true,
      ...options,
    });
};
```

```tsx
// components/button.tsx

import { createComponent } from "../lib/create-component";

type ButtonProps = {
  variant: string;
};

const Button = createComponent<ButtonProps>()({
  element: "button",
  Render: (Component, { variant, ...rest }) => (
    <Component data-variant={variant} {...rest} />
  ),
});

Button.displayName = "Button";

// Still memoized by default, but a single component can opt out:
const Unmemoized = createComponent()({
  memo: false,
  Render: (Component, props) => <Component {...props} />,
});
```

Every component created through this facade's `createComponent` picks up the shared default, while `Unmemoized` shows a per-component override still works — the facade only sets a default, it doesn't lock the option in.

### Multiple factories

The same idea extends naturally to more than one facade. Instead of a single general-purpose `createComponent`, a codebase can expose a small set of purpose-built ones — for example, `createPolymorphicComponent` for components that should always support the `component` swap prop, and `createStrictComponent` for components with a semantic constraint on their root element (a `<Form>` that must always render as `<form>`, never as `<div>`):

```tsx
// lib/create-component.ts

type ComponentOptions<TElement extends ElementType, TCustomProps> = Omit<
  CreateComponentFactoryOptions<TElement, TCustomProps>,
  "polymorphic"
>;

export const createPolymorphicComponent = <
  TCustomProps extends Record<string, unknown> = Record<never, never>,
>() => {
  const factory = createComponentFactory<TCustomProps>();

  return <TElement extends ElementType = "div">(
    options: ComponentOptions<TElement, TCustomProps>,
  ) => factory<TElement, true>({ ...options, polymorphic: true });
};

export const createStrictComponent = <
  TCustomProps extends Record<string, unknown> = Record<never, never>,
>() => {
  const factory = createComponentFactory<TCustomProps>();

  return <TElement extends ElementType = "div">(
    options: ComponentOptions<TElement, TCustomProps>,
  ) => factory<TElement, false>({ ...options, polymorphic: false });
};
```

```tsx
// components/form.tsx

import { createStrictComponent } from "../lib/create-component";

const Form = createStrictComponent()({
  element: "form",
  Render: (Component, props) => <Component {...props} />,
});

Form.displayName = "Form";
```

## API

### `createComponent<TCustomProps>()(options)`

Options accepted by the second call, i.e. the descriptor passed to `createComponent<TCustomProps>()({ ... })`:

| Property      | Type                                                  | Default     | Description                                                                                                                                                        |
| ------------- | ----------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `element`     | `ElementType`                                          | `"div"`     | The default host tag or component rendered when no polymorphic `component` prop is supplied at call time.                                                        |
| `Render`      | `(Component, props) => ReactNode \| Promise<ReactNode>` | _required_  | Produces the actual output for the resolved element and cleaned-up props. May be async for Server Components.                                                    |
| `memo`        | `boolean \| (prev, next) => boolean`                   | `undefined` | Wraps the resulting component in `React.memo`. `true` uses the default shallow comparison; a function supplies a custom comparator. Omitted/`false` skips memoization. |
| `polymorphic` | `boolean`                                               | `true`      | Whether the resulting component accepts a `component` prop that swaps the rendered element at call time. `false` removes `component` from the type entirely.    |

### Produced component props

Props accepted by the component returned from `createComponent<TCustomProps>()({ ... })`:

| Property    | Type          | Default                         | Description                                                                                                    |
| ----------- | ------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `component` | `ElementType` | `element` from the descriptor    | Swaps the rendered element for this call only. Only present when `polymorphic` is `true` (the default).       |
| `ref`       | inferred      | —                                 | Forwarded straight to the resolved root — typed per the actually rendered element, no `forwardRef` required. |
| ...         | `TCustomProps & native props of the resolved element` | — | Everything else: your custom props plus the resolved element's own native props (custom props win on name conflicts). |

## FAQ

<details>
<summary>Why is <code>Render</code> capitalized while other options are lowercase?</summary>
<br />

Because `Render` is meant to be treated as a component by React's own tooling, not just as a plain callback. Both JSX itself and the `react-hooks/rules-of-hooks` ESLint rule decide whether something is "component-like" purely from its identifier's casing: PascalCase is treated as a component (or a `use`-prefixed function as a custom hook), anything else as an ordinary value or function. That's exactly the convention `Render` needs to satisfy, since it's expected to be able to call React hooks internally. Naming it `Render` (capitalized) is what lets the hooks linter recognize it as a valid place to call hooks, instead of flagging every hook call inside it as being outside a component or custom hook.

</details>
