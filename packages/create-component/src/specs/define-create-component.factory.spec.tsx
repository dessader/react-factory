import { render, screen } from "@testing-library/react";
import { defineCreateComponent } from "../define-create-component.factory";

const REACT_MEMO_TYPE = Symbol.for("react.memo");

describe("defineCreateComponent", () => {
  /**
   * The first call binds project-wide defaults and must return a plain
   * function, not a component itself, mirroring `createComponent`'s own
   * curried shape.
   */
  it("returns a factory function when called without options", () => {
    const localCreateComponent = defineCreateComponent();

    expect(typeof localCreateComponent).toBe("function");
  });

  /**
   * Calling `defineCreateComponent` with no defaults at all must behave
   * exactly like the raw `createComponent`: a "div" root, polymorphic by
   * default, unmemoized.
   */
  it("behaves like createComponent when called with no defaults", () => {
    const localCreateComponent = defineCreateComponent();

    const Box = localCreateComponent()({
      Render: (Component, props) => <Component {...props} />,
    });

    render(<Box component='section'>content</Box>);

    const node = screen.getByText("content");
    expect(node.tagName).toBe("SECTION");

    const internals = Box as unknown as { $$typeof?: symbol };
    expect(internals.$$typeof).not.toBe(REACT_MEMO_TYPE);
  });

  /**
   * A component that doesn't override `element` must render as the default
   * tag configured on the local factory.
   */
  it("applies the default element to a component that doesn't override it", () => {
    const localCreateComponent = defineCreateComponent({ element: "button" });

    const Trigger = localCreateComponent()({
      Render: (Component, props) => <Component {...props} />,
    });

    render(<Trigger>click me</Trigger>);

    expect(screen.getByText("click me").tagName).toBe("BUTTON");
  });

  /**
   * A component is still free to render as a different tag than the local
   * factory's default, by supplying its own `element`.
   */
  it("lets a component override the default element", () => {
    const localCreateComponent = defineCreateComponent({ element: "button" });

    const Label = localCreateComponent()({
      element: "span",
      Render: (Component, props) => <Component {...props} />,
    });

    render(<Label>text</Label>);

    expect(screen.getByText("text").tagName).toBe("SPAN");
  });

  /**
   * `memo: true` set on the local factory must apply to every component
   * created from it that doesn't opt out.
   */
  it("wraps components in React.memo when the local factory defaults to memo: true", () => {
    const localCreateComponent = defineCreateComponent({ memo: true });

    const Box = localCreateComponent()({
      Render: (Component, props) => <Component {...props} />,
    });

    const internals = Box as unknown as { $$typeof?: symbol };
    expect(internals.$$typeof).toBe(REACT_MEMO_TYPE);
  });

  /**
   * A single component must be able to opt out of a local factory-wide
   * `memo: true` default by passing `memo: false` itself.
   */
  it("lets a component opt out of the local factory's default memoization", () => {
    const localCreateComponent = defineCreateComponent({ memo: true });

    const Unmemoized = localCreateComponent()({
      memo: false,
      Render: (Component, props) => <Component {...props} />,
    });

    const internals = Unmemoized as unknown as { $$typeof?: symbol };
    expect(internals.$$typeof).not.toBe(REACT_MEMO_TYPE);
  });

  /**
   * `polymorphic: false` set on the local factory must apply by default:
   * a `component` prop forced through via a type-unsafe spread must be
   * inert and must not leak into the DOM.
   */
  it("disables polymorphism when the local factory defaults to polymorphic: false", () => {
    const localCreateComponent = defineCreateComponent({
      polymorphic: false,
    });

    const StrictBox = localCreateComponent()({
      Render: (Component, props) => <Component {...props} />,
    });

    render(
      <StrictBox {...({ component: "section" } as unknown as object)}>
        content
      </StrictBox>,
    );

    const node = screen.getByText("content");
    expect(node.tagName).toBe("DIV");
    expect(node).not.toHaveAttribute("component");
  });

  /**
   * A component must be able to re-enable polymorphism for itself even
   * when the local factory defaults to `polymorphic: false`.
   */
  it("lets a component override the local factory's polymorphic: false default", () => {
    const localCreateComponent = defineCreateComponent({
      polymorphic: false,
    });

    const Box = localCreateComponent()({
      polymorphic: true,
      Render: (Component, props) => <Component {...props} />,
    });

    render(<Box component='section'>content</Box>);

    expect(screen.getByText("content").tagName).toBe("SECTION");
  });

  /**
   * Two local factories created from separate `defineCreateComponent`
   * calls must not share state: defaults configured on one must have no
   * effect on components produced by the other.
   */
  it("keeps defaults isolated between independent defineCreateComponent calls", () => {
    const createPolymorphicComponent = defineCreateComponent({
      polymorphic: true,
    });
    const createStrictComponent = defineCreateComponent({
      polymorphic: false,
    });

    const Polymorphic = createPolymorphicComponent()({
      Render: (Component, props) => <Component {...props} />,
    });
    const Strict = createStrictComponent()({
      Render: (Component, props) => <Component {...props} />,
    });

    render(
      <>
        <Polymorphic component='span' data-testid='polymorphic'>
          a
        </Polymorphic>
        <Strict
          {...({ component: "span" } as unknown as object)}
          data-testid='strict'
        >
          b
        </Strict>
      </>,
    );

    expect(screen.getByTestId("polymorphic").tagName).toBe("SPAN");
    expect(screen.getByTestId("strict").tagName).toBe("DIV");
  });

  /**
   * Custom props declared via `localCreateComponent<TCustomProps>()` must
   * reach `Render` the same way they do with the raw `createComponent`,
   * confirming the extra currying level doesn't interfere with prop flow.
   */
  it("forwards custom props declared on the local factory call", () => {
    const localCreateComponent = defineCreateComponent({ memo: true });

    const Badge = localCreateComponent<{ count: number }>()({
      element: "span",
      Render: (Component, { count, ...props }) => (
        <Component data-count={count} {...props} />
      ),
    });

    render(<Badge count={3} />);

    expect(screen.getByText("", { selector: "span" })).toHaveAttribute(
      "data-count",
      "3",
    );
  });

  /**
   * `data-origin-component` / `data-resolved-component` tagging must keep
   * working unchanged for components built through a local factory.
   */
  it("still tags data-origin-component and data-resolved-component", () => {
    const localCreateComponent = defineCreateComponent();

    const Box = localCreateComponent()({
      Render: (Component, props) => <Component {...props} />,
    });
    Box.displayName = "Box";

    render(<Box component='section'>content</Box>);

    const node = screen.getByText("content");
    expect(node).toHaveAttribute("data-origin-component", "Box");
    expect(node).toHaveAttribute("data-resolved-component", "FactorySection");
  });
});
