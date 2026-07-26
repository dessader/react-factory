<img src=".github/assets/cover.png" alt="React Forge" width="100%" />

# React Forge

[Motivation](#motivation) • [Get Started](#get-started) • [Examples](#examples) • [Advanced](#advanced) • [Additional](#additional) • [API](#api) • [FAQ](#faq)

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
  Render: (Component, { tone, ...props }) => (
    <Component data-tone={tone} {...props} />
  ),
});

Text.displayName = "Text";

// Usage
<Text tone="accent" className="text-lg" />
<Text component="span" tone="muted" />
```

> See the [Advanced](#advanced) section for a recommended pattern once you're ready to use the factory across a whole codebase.

## Examples

### Custom root element (`element`)

```tsx
import { createComponent } from "@react-forge/core";

const Card = createComponent()({
  element: "article",
  Render: (Component, props) => <Component {...props} />,
});

Card.displayName = "Card";

// Usage
<Card className='card' />;
```

Renders to:

```html
<article class="card" data-origin-component="Card"></article>
```

### Custom props (`Render`)

```tsx
import { createComponent } from "@react-forge/core";

type BadgeProps = {
  count: number;
};

const Badge = createComponent<BadgeProps>()({
  element: "span",
  Render: (Component, { count, ...props }) => (
    <Component data-count={count} {...props} />
  ),
});

Badge.displayName = "Badge";

// Usage
<Badge count={3} />;
```

Renders to:

```html
<span data-count="3" data-origin-component="Badge"></span>
```

### Polymorphism (`component` prop)

```tsx
import { createComponent } from "@react-forge/core";

const Heading = createComponent()({
  element: "h2",
  Render: (Component, props) => <Component {...props} />,
});

Heading.displayName = "Heading";

// Usage
<Heading>Renders as an h2 by default</Heading>
<Heading component="h1">Renders as an h1</Heading>
<Heading component="a" href="/docs">
  Renders as a link, fully typed against anchor props
</Heading>
```

Renders to:

```html
<h2 data-origin-component="Heading">Renders as an h2 by default</h2>
<h1 data-resolved-component="FactoryH1" data-origin-component="Heading">
  Renders as an h1
</h1>
<a
  href="/docs"
  data-resolved-component="FactoryA"
  data-origin-component="Heading"
>
  Renders as a link, fully typed against anchor props
</a>
```

`data-resolved-component` only shows up once polymorphism is actually exercised — the default `<h2>` case above doesn't get one.

### Disabling polymorphism (`polymorphic`)

```tsx
import { createComponent } from "@react-forge/core";

const Form = createComponent()({
  element: "form",
  polymorphic: false,
  Render: (Component, props) => <Component {...props} />,
});

Form.displayName = "Form";

// Usage
<Form action="/submit" />

// Type error — `component` doesn't exist on Form's props:
<Form component="div" />
```

Renders to:

```html
<form action="/submit" data-origin-component="Form"></form>
```

`data-resolved-component` can never appear here — there's no `component` prop to exercise.

### Memoization (`memo`)

```tsx
import { createComponent } from "@react-forge/core";

type AvatarProps = {
  src: string;
};

// `true` uses React.memo's default shallow prop comparison
const Avatar = createComponent<AvatarProps>()({
  element: "img",
  memo: true,
  Render: (Component, { src, ...props }) => (
    <Component src={src} {...props} />
  ),
});

Avatar.displayName = "Avatar";

type PriceProps = {
  amount: number;
};

// A comparator function skips re-renders only when `amount` is unchanged,
// ignoring any other prop
const Price = createComponent<PriceProps>()({
  element: "span",
  memo: (prev, next) => prev.amount === next.amount,
  Render: (Component, { amount, ...props }) => (
    <Component {...props}>{amount}</Component>
  ),
});

Price.displayName = "Price";

// Usage
<Avatar src="/avatar.png" />
<Price amount={42} />
```

Renders to:

```html
<img src="/avatar.png" data-origin-component="Avatar" />
<span data-origin-component="Price">42</span>
```

### Ref forwarding

```tsx
import { useRef } from "react";
import { createComponent } from "@react-forge/core";

const Input = createComponent()({
  element: "input",
  Render: (Component, props) => <Component {...props} />,
});

Input.displayName = "Input";

// Usage
const inputRef = useRef<HTMLInputElement>(null);
<Input ref={inputRef} />

// Typed as HTMLTextAreaElement | null once the root is swapped:
<Input component="textarea" ref={(el) => console.log(el)} />
```

Renders to:

```html
<input data-origin-component="Input" />
<textarea
  data-resolved-component="FactoryTextarea"
  data-origin-component="Input"
></textarea>
```

`ref` itself never shows up in the DOM — it's a React-only mechanism for getting a handle to the underlying node, not an HTML attribute.

### Async Server Components

The function passed to `Render` can be asynchronous — this only works when it's used in a server environment (Server Components).

```tsx
import { createComponent } from "@react-forge/core";

type Post = {
  id: number;
  title: string;
};

const fetchPosts = async (limit: number): Promise<Post[]> => {
  const response = await fetch(
    `https://jsonplaceholder.typicode.com/posts?_limit=${limit}`,
  );

  return response.json();
};

type PostListProps = {
  limit: number;
};

const PostList = createComponent<PostListProps>()({
  element: "ul",
  Render: async (Component, { limit, ...props }) => {
    const posts = await fetchPosts(limit);

    return (
      <Component {...props}>
        {posts.map((post) => (
          <li key={post.id}>{post.title}</li>
        ))}
      </Component>
    );
  },
});

PostList.displayName = "PostList";
```

```tsx
// app/posts/page.tsx — a Server Component, no "use client"

const PostsPage = () => <PostList limit={3} />;

export default PostsPage;
```

Renders to:

```html
<ul data-origin-component="PostList">
  <li>...</li>
  <li>...</li>
  <li>...</li>
</ul>
```

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
  Render: (Component, { variant, ...props }) => (
    <Component data-variant={variant} {...props} />
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

## Additional

### Component metadata

Every component created by the factory tags its rendered output with `data-*` attributes, so you can inspect what actually got rendered directly in the DOM or devtools.

Two attributes are involved:

- **`data-origin-component`** — the name of the outermost factory component in a composition chain. It's only set when absent, so if a factory component is passed as another factory component's `component` prop, the name of the one that started the chain is preserved, not overwritten by the inner one.
- **`data-resolved-component`** — the name of what the component actually resolved to, but only when polymorphism was exercised for that particular call (i.e. a `component` prop was supplied). It's absent otherwise — see the [Polymorphism](#polymorphism-component-prop) example above.

Both names are read from the component's `displayName` live, at render time — not captured once when the component was created. That means reassigning `displayName` after the fact (the standard React convention, e.g. `Box.displayName = "Box"`) is picked up on the very next render, and this holds even for memoized components.

### Component naming

The factory has no way to know what variable you assign its return value to. `const Box = createComponent()({ ... })` cannot make the resulting component call itself `"Box"` at runtime: by the time `createComponent()({ ... })` finishes executing, the variable `Box` doesn't exist yet, and JavaScript never passes an "assignment target" into the function being assigned — there's no call-context to read a name from. Stack-trace-based tricks exist, but they're unreliable (broken by minification, inconsistent across engines) and expensive to run per component. The only way to solve this properly is a build-time plugin (Babel/SWC) that rewrites the call site — a real option, but one that's rarely worth adopting for a single project.

This is the trade-off: **you're expected to set `displayName` by hand** on anything you want to recognize in React DevTools, error messages, or the `data-origin-component`/`data-resolved-component` attributes above:

```tsx
const Box = createComponent()({ ... });
Box.displayName = "Box";
```

If you skip this, the factory still assigns a fallback `displayName` automatically, derived from the resolved default `element`:

- For intrinsic (string) elements, the tag is capitalized and prefixed with `Factory` — `"div"` becomes `"FactoryDiv"`, `"span"` becomes `"FactorySpan"`, and so on.
- For component elements (when `element` is itself a component), it uses that component's own `displayName`, falling back to its `.name`, and finally to `"FactoryUnknownComponent"` if neither is available.

This fallback is also what powers `data-resolved-component` when a polymorphic `component` prop is supplied without an explicit name attached to it (e.g. `<Heading component="a" />` resolving to `FactoryA`, as shown in the [Polymorphism](#polymorphism-component-prop) example).

## API

### `createComponent<TCustomProps>()(options)`

Options accepted by the second call, i.e. the descriptor passed to `createComponent<TCustomProps>()({ ... })`:

| Property      | Type                                                    | Default     | Description                                                                                                                                                            |
| ------------- | ------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `element`     | `ElementType`                                           | `"div"`     | The default host tag or component rendered when no polymorphic `component` prop is supplied at call time.                                                              |
| `Render`      | `(Component, props) => ReactNode \| Promise<ReactNode>` | _required_  | Produces the actual output for the resolved element and cleaned-up props. May be async for Server Components.                                                          |
| `memo`        | `boolean \| (prev, next) => boolean`                    | `undefined` | Wraps the resulting component in `React.memo`. `true` uses the default shallow comparison; a function supplies a custom comparator. Omitted/`false` skips memoization. |
| `polymorphic` | `boolean`                                               | `true`      | Whether the resulting component accepts a `component` prop that swaps the rendered element at call time. `false` removes `component` from the type entirely.           |

### Produced component props

Props accepted by the component returned from `createComponent<TCustomProps>()({ ... })`:

| Property    | Type                                                  | Default                       | Description                                                                                                           |
| ----------- | ----------------------------------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `component` | `ElementType`                                         | `element` from the descriptor | Swaps the rendered element for this call only. Only present when `polymorphic` is `true` (the default).               |
| `ref`       | inferred                                              | —                             | Forwarded straight to the resolved root — typed per the actually rendered element, no `forwardRef` required.          |
| ...         | `TCustomProps & native props of the resolved element` | —                             | Everything else: your custom props plus the resolved element's own native props (custom props win on name conflicts). |

## FAQ

<details>
<summary>Why is <code>Render</code> capitalized while other options are lowercase?</summary>
<br />

Because `Render` is meant to be treated as a component by React's own tooling, not just as a plain callback. Both JSX itself and the `react-hooks/rules-of-hooks` ESLint rule decide whether something is "component-like" purely from its identifier's casing: PascalCase is treated as a component (or a `use`-prefixed function as a custom hook), anything else as an ordinary value or function. That's exactly the convention `Render` needs to satisfy, since it's expected to be able to call React hooks internally. Naming it `Render` (capitalized) is what lets the hooks linter recognize it as a valid place to call hooks, instead of flagging every hook call inside it as being outside a component or custom hook.

</details>
