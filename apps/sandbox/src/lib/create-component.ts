import { defineCreateComponent } from "@react-factory/create-component";

// For example, for some reason, we want to enable memoization for all components.
export const createComponent = defineCreateComponent({ memo: true });

export const createPolymorphicComponent = defineCreateComponent({
  polymorphic: true,
});

export const createStrictComponent = defineCreateComponent({
  polymorphic: false,
});

// A local factory whose components default to rendering as a button,
// unless a given component overrides `element` itself.
export const createToolbarComponent = defineCreateComponent({
  element: "button",
});
