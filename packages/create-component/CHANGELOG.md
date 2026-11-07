# @react-factory/create-component

## 0.3.0

### Minor Changes

- 9f39caa: `polymorphic` now accepts an allow-list of tags and components. A `component` outside the list (other than the default `element`) is a type error, and a runtime error in development.

  ```tsx
  const Caption = createComponent()({
    element: "p",
    polymorphic: ["span", "figcaption", Icon],
    Render: (Component, props) => <Component {...props} />,
  });
  ```

  A factory component passed as another factory component's `component` is now typed by its default element and custom props. For components with `polymorphic: true` this is stricter than before: props that its default element doesn't accept are now a type error.

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
