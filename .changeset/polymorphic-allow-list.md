---
"@react-factory/create-component": minor
---

`polymorphic` now accepts an allow-list of tags and components. A `component` outside the list (other than the default `element`) is a type error, and a runtime error in development.

```tsx
const Caption = createComponent()({
  element: "p",
  polymorphic: ["span", "figcaption", Icon],
  Render: (Component, props) => <Component {...props} />,
});
```

A factory component passed as another factory component's `component` is now typed by its default element and custom props. For components with `polymorphic: true` this is stricter than before: props that its default element doesn't accept are now a type error.
