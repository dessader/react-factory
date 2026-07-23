import { createElement, isValidElement } from "react";
import { createComponent } from "../create-component.factory";

describe("createComponent", () => {
  /**
   * `createComponent` is curried: the first call (with the custom props
   * generic) must return a plain factory function, not a component itself.
   */
  it("returns a factory function when called without options", () => {
    const factory = createComponent();

    expect(typeof factory).toBe("function");
  });

  /**
   * Invoking the curried factory with `options` should produce the actual
   * component — a callable function, not some other kind of object.
   */
  it("returns a component function when the factory is invoked with options", () => {
    const FactoryComponent = createComponent()({
      Render: (Component, props) => createElement(Component, props),
    });

    expect(typeof FactoryComponent).toBe("function");
  });

  /**
   * The component produced by the factory must behave like any normal
   * React component when used with `createElement` — a valid element
   * whose `type` is the component itself.
   */
  it("produces a valid React element when rendered", () => {
    const FactoryComponent = createComponent()({
      Render: (Component, props) => createElement(Component, props),
    });

    const element = createElement(FactoryComponent, { children: "hello" });

    expect(isValidElement(element)).toBe(true);
    expect(element.type).toBe(FactoryComponent);
  });
});
