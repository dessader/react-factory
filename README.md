<img src=".github/assets/cover.png" alt="React Forge" width="100%" />

# React Forge

A lightweight factory for building type-safe, polymorphic React components.

- 🪶 **Zero dependencies and minimal size** – less than 1 KB gzipped
- 🔀 **Polymorphism support** – swap the root element with another DOM node or React component
- 🛡️ **Fully typed** – every component infers its prop types from the default root element, and also accounts for the props of whatever element or component is swapped in via the polymorphic prop
- 🔗 **Automatic ref forwarding** – `ref` is passed straight through to the resolved root, keeping components fully open for customization, direct DOM node access, and integration with third-party libraries
- ⚡ **SSR-ready & async-aware** – fully support for Server Components

> ⚛️ **Requires React 19 or later.**
>
> The library relies on passing `ref` as a plain prop and does not support `forwardRef`, since it's [deprecated](https://react.dev/reference/react/forwardRef). This is why only React 19 and above are supported.

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
