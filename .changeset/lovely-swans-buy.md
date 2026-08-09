---
"@react-factory/create-component": minor
---

A new utility, `defineCreateComponent`, allows you to create pre-configured instances of the `createComponent` factory.

```tsx
export const createComponent = defineCreateComponent({ memo: true });

const Button = createComponent<ButtonProps>()({
  element: "button",
  Render: (Component, { variant, ...props }) => (
    <Component data-variant={variant} {...props} />
  ),
});
```
