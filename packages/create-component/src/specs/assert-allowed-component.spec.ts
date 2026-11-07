import { assertAllowedComponent } from "../utils/assert-allowed-component";

describe("assertAllowedComponent", () => {
  /**
   * The default element is always allowed, even when it is not listed.
   */
  it("accepts the default element", () => {
    expect(() =>
      assertAllowedComponent("Box", "p", "p", ["span"]),
    ).not.toThrow();
  });

  /**
   * A listed element passes, compared by identity.
   */
  it("accepts a listed element", () => {
    const Label = () => null;

    expect(() =>
      assertAllowedComponent("Box", Label, "p", ["span", Label]),
    ).not.toThrow();
  });

  /**
   * Tags are quoted and components named by `displayName` in the message.
   */
  it("throws with the component name, the rejected tag and the allowed list", () => {
    const Label = () => null;
    Label.displayName = "Label";

    expect(() =>
      assertAllowedComponent("Box", "a", "p", ["span", Label]),
    ).toThrow(
      '[create-component] Box received component="a", which is not in its polymorphic allow-list. Allowed: "p", "span", Label.',
    );
  });

  /**
   * Without a `displayName`, a component is named by its function `.name`.
   */
  it("names a component by its function name when displayName is not set", () => {
    function NamedComponent() {
      return null;
    }

    expect(() =>
      assertAllowedComponent("Box", NamedComponent, "p", []),
    ).toThrow(/received component=NamedComponent,/);
  });

  /**
   * An anonymous function has `.name === ""`; it must fall back to a
   * placeholder instead of leaving the name blank.
   */
  it("names an anonymous component UnknownComponent", () => {
    const [Anonymous] = [() => null];

    expect(Anonymous.name).toBe("");
    expect(() => assertAllowedComponent("Box", Anonymous, "p", [])).toThrow(
      /received component=UnknownComponent,/,
    );
  });

  /**
   * A factory component whose `displayName` was reset to `undefined` is
   * reported under a generic name.
   */
  it("falls back to a generic component name", () => {
    expect(() => assertAllowedComponent(undefined, "a", "p", [])).toThrow(
      /^\[create-component\] Component received component="a"/,
    );
  });
});
