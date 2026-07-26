<img src=".github/assets/cover.png" alt="React Forge" width="100%" />

# React Forge

[Motivation](#motivation) • [Get Started](#get-started) • [Examples](#examples) • [API](#api) • [FAQ](#faq)

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

### Basic usage

```tsx
import { createComponent } from "@react-forge/core";

type TextProps = {
  weight?: "normal" | "bold";
};

const Text = createComponent<TextProps>()({
  element: "p",
  Render: (Component, { weight, ...rest }) => (
    <Component
      style={{ fontWeight: weight === "bold" ? 700 : 400 }}
      {...rest}
    />
  ),
});

Text.displayName = "Text";

const App = () => <Text weight='bold'>Hello, React Forge!</Text>;
```

### Polymorphic components

Every component is polymorphic by default: pass a `component` prop to render as a different element without changing the component's own props or behavior.

```tsx
const Box = createComponent()({
  element: "div",
  Render: (Component, props) => <Component {...props} />,
});

Box.displayName = "Box";

// Renders a <section> instead of the default <div>
<Box component='section'>Content</Box>;
```

`component` isn't limited to intrinsic tags — it accepts **any** React component, not just ones created with `createComponent`. When it happens to be another factory component, you also get that component's own typed props for free. Either way, the rendered element carries two data attributes: `data-origin-component` (who was originally invoked) and `data-resolved-component` (what it actually resolved to).

```tsx
type LinkProps = {
  href: string;
};

const Link = createComponent<LinkProps>()({
  element: "a",
  Render: (Component, { href, ...rest }) => <Component href={href} {...rest} />,
});

Link.displayName = "Link";

const Button = createComponent()({
  element: "button",
  Render: (Component, props) => <Component {...props} />,
});

Button.displayName = "Button";

// `href` is required here — it's typed from Link, not from Button
<Button component={Link} href='/docs'>
  Read the docs
</Button>;
```

Renders as:

```html
<a href="/docs" data-resolved-component="Link" data-origin-component="Button"
  >Read the docs</a
>
```

## Examples

_Coming soon._

## API

_Coming soon._

## FAQ

<details>
<summary>Why is <code>Render</code> capitalized while other options are lowercase?</summary>

Because `Render` is meant to be treated as a component by React's own tooling, not just as a plain callback. Both JSX itself and the `react-hooks/rules-of-hooks` ESLint rule decide whether something is "component-like" purely from its identifier's casing: PascalCase is treated as a component (or a `use`-prefixed function as a custom hook), anything else as an ordinary value or function. That's exactly the convention `Render` needs to satisfy, since it's expected to be able to call React hooks internally. Naming it `Render` (capitalized) is what lets the hooks linter recognize it as a valid place to call hooks, instead of flagging every hook call inside it as being outside a component or custom hook.

</details>
