import { getComponentDisplayName } from "../utils/get-component-display-name";

import type { ElementType } from "react";

describe("getComponentDisplayName", () => {
  /**
   * Intrinsic (string) elements should get a "Factory"-prefixed name derived
   * from the tag itself, even for the shortest possible tag name.
   */
  it("capitalizes a single-character intrinsic element", () => {
    expect(getComponentDisplayName("a")).toBe("FactoryA");
  });

  /**
   * Confirms the capitalization only touches the first character of a
   * multi-character intrinsic tag, leaving the rest untouched.
   */
  it("capitalizes only the first character of an intrinsic element", () => {
    expect(getComponentDisplayName("button")).toBe("FactoryButton");
  });

  /**
   * Guards against accidentally lowercasing/altering the rest of a
   * camelCase tag name while capitalizing only the first letter.
   */
  it("preserves the casing of the rest of a camelCase custom element", () => {
    expect(getComponentDisplayName("myElement" as ElementType)).toBe(
      "FactoryMyElement",
    );
  });

  /**
   * `displayName` is the highest-priority naming source for component
   * elements and must win even when a `.name` is also present.
   */
  it("prefers displayName over the function name", () => {
    const Component = () => null;
    Component.displayName = "CustomName";

    expect(getComponentDisplayName(Component)).toBe("CustomName");
  });

  /**
   * Without an explicit `displayName`, the function's own `.name` should
   * be used as the fallback identifier.
   */
  it("falls back to the function name when displayName is not set", () => {
    function NamedComponent() {
      return null;
    }

    expect(getComponentDisplayName(NamedComponent)).toBe("NamedComponent");
  });

  /**
   * When a component has neither `displayName` nor a usable `.name`
   * (forced empty here to simulate an anonymous function), the utility
   * must fall back to a generic placeholder instead of throwing or
   * returning an empty string.
   */
  it("falls back to FactoryUnknownComponent when neither displayName nor name is set", () => {
    const Component = () => null;
    Object.defineProperty(Component, "name", { value: undefined });

    expect(getComponentDisplayName(Component)).toBe("FactoryUnknownComponent");
  });
});
