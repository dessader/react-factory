import { createElement, isValidElement } from "react";
import { createComponent } from "./create-component.factory";

describe("createComponent", () => {
  it("returns a factory function when called without options", () => {
    const factory = createComponent();

    expect(typeof factory).toBe("function");
  });

  it("returns a component function when the factory is invoked with options", () => {
    const Component = createComponent()({
      Render: (Tag, props) => createElement(Tag, props),
    });

    expect(typeof Component).toBe("function");
  });

  it("produces a valid React element when rendered", () => {
    const Component = createComponent()({
      Render: (Tag, props) => createElement(Tag, props),
    });

    const element = createElement(Component, { children: "hello" });

    expect(isValidElement(element)).toBe(true);
    expect(element.type).toBe(Component);
  });
});
