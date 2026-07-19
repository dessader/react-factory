import { getComponentDisplayName } from "./get-component-display-name";

import type { ElementType } from "react";

describe("getComponentDisplayName", () => {
  it("capitalizes a single-character intrinsic element", () => {
    expect(getComponentDisplayName("a")).toBe("FactoryA");
  });

  it("capitalizes only the first character of an intrinsic element", () => {
    expect(getComponentDisplayName("button")).toBe("FactoryButton");
  });

  it("preserves the casing of the rest of a camelCase custom element", () => {
    expect(getComponentDisplayName("myElement" as ElementType)).toBe(
      "FactoryMyElement",
    );
  });

  it("prefers displayName over the function name", () => {
    const Component = () => null;
    Component.displayName = "CustomName";

    expect(getComponentDisplayName(Component)).toBe("CustomName");
  });

  it("falls back to the function name when displayName is not set", () => {
    function NamedComponent() {
      return null;
    }

    expect(getComponentDisplayName(NamedComponent)).toBe("NamedComponent");
  });

  it("falls back to FactoryUnknownComponent when neither displayName nor name is set", () => {
    const Component = () => null;
    Object.defineProperty(Component, "name", { value: undefined });

    expect(getComponentDisplayName(Component)).toBe("FactoryUnknownComponent");
  });
});
