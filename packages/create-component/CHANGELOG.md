# @react-factory/create-component

## 0.2.0

### Minor Changes

- 4480581: A new utility, `defineCreateComponent`, allows you to create pre-configured instances of the `createComponent` factory.

  ```tsx
  export const createComponent = defineCreateComponent({ memo: true });

  const Button = createComponent<ButtonProps>()({
    element: "button",
    Render: (Component, { variant, ...props }) => (
      <Component data-variant={variant} {...props} />
    ),
  });
  ```

## 0.1.0

### Minor Changes

- 7d62db2: Fix typo in README (old naming)
