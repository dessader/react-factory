<img src=".github/assets/cover.png" alt="React Forge" width="100%" />

# React Forge

A lightweight factory for building type-safe, polymorphic React components.

- ⭐ **Zero dependencies**
- ⭐ **Minimal footprint** – 0.6 KB gzipped
- ⭐ **Fully typed** — end-to-end type inference for props
- ⭐ **Native props out of the box** — every component comes with the full set of props of its underlying DOM element, or of whatever component it's swapped to, merged together with your own custom props
- ⭐ **Automatic ref forwarding** — `ref` is passed straight through to the resolved element, no `forwardRef` needed
- ⭐ **SSR-ready & async-aware** — fully support for Server Components

⚛️ Requires React 19 or later.

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
