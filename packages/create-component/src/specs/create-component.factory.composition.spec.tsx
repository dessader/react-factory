import { render, screen } from "@testing-library/react";
import { createComponent } from "../create-component.factory";

import type { ReactNode } from "react";

describe("createComponent: composition of factory components", () => {
  /**
   * When one factory component swaps to another via `component`, the
   * final DOM node should carry both identities: who was originally
   * invoked (origin) and what it ultimately resolved to.
   */
  it("preserves the outer origin and reflects the swapped-in factory component in a two-level composition", () => {
    const Inner = createComponent()({
      Render: (Component, props) => <Component {...props} />,
    });
    Inner.displayName = "InnerFactory";

    const Outer = createComponent()({
      element: "span",
      Render: (Component, props) => <Component {...props} />,
    });
    Outer.displayName = "OuterFactory";

    render(<Outer component={Inner}>content</Outer>);

    const node = screen.getByText("content");
    expect(node.tagName).toBe("DIV");
    expect(node).toHaveAttribute("data-origin-component", "OuterFactory");
    expect(node).toHaveAttribute("data-resolved-component", "InnerFactory");
  });

  /**
   * Exercises a chain of two independent, dynamic polymorphic swaps
   * (Outer -> Bridge -> Middle -> Innermost). Origin must stay pinned to
   * the first caller across the whole chain, while resolved must track
   * the most recent activation rather than an intermediate step.
   */
  it("keeps the origin fixed at the first activation while resolved reflects the most recent dynamic swap", () => {
    const Innermost = createComponent()({
      element: "span",
      Render: (Component, props) => <Component {...props} />,
    });
    Innermost.displayName = "Innermost";

    const Middle = createComponent()({
      Render: (Component, props) => <Component {...props} />,
    });
    Middle.displayName = "Middle";

    const Bridge = ({
      children,
      ...rest
    }: { children?: ReactNode } & Record<string, unknown>) => (
      <Middle component={Innermost} {...(rest as object)}>
        {children}
      </Middle>
    );

    const Outer = createComponent()({
      element: "p",
      Render: (Component, props) => <Component {...props} />,
    });
    Outer.displayName = "Outer";

    render(<Outer component={Bridge}>content</Outer>);

    const node = screen.getByText("content");
    expect(node.tagName).toBe("SPAN");
    expect(node).toHaveAttribute("data-origin-component", "Outer");
    expect(node).toHaveAttribute("data-resolved-component", "Innermost");
  });

  /**
   * Composition relies on an intermediate `Render` spreading unknown
   * props through to the host element. This confirms that when it
   * doesn't, the chain falls back to the inner component's own identity
   * instead of crashing or silently mis-tagging the DOM node.
   */
  it("cannot propagate origin/resolved through a composed component whose Render drops unknown props", () => {
    const Inner = createComponent<{ label: string }>()({
      element: "span",
      Render: (Component, { label }) => <Component>{label}</Component>,
    });
    Inner.displayName = "Inner";

    const Outer = createComponent()({
      Render: (Component, props) => <Component {...props} />,
    });
    Outer.displayName = "Outer";

    render(
      <Outer component={Inner} label='content'>
        content
      </Outer>,
    );

    const node = screen.getByText("content");
    expect(node.tagName).toBe("SPAN");
    expect(node).toHaveAttribute("data-origin-component", "Inner");
    expect(node).not.toHaveAttribute("data-resolved-component");
  });
  /**
   * A factory component passed as another factory component's `component`
   * never receives a `component` of its own, so it always renders its
   * default element. Its props must be typed by that element plus its own
   * custom props, not by the props common to every element of its
   * allow-list. Elements are only created, never rendered, so the
   * `@ts-expect-error` lines are checked by the `typecheck` target alone.
   */
  it("types a composed factory component by its default element and custom props", () => {
    const Icon = createComponent<{ name: string }>()({
      element: "i",
      polymorphic: false,
      Render: (Component, props) => <Component {...props} />,
    });

    const Text = createComponent()({
      element: "span",
      polymorphic: ["strong", Icon],
      Render: (Component, props) => <Component {...props} />,
    });

    const Labeled = createComponent<{ label: string }>()({
      element: "a",
      Render: (Component, props) => <Component {...props} />,
    });

    const Button = createComponent()({
      element: "button",
      Render: (Component, props) => <Component {...props} />,
    });

    const elements = [
      <Button key='allow-list-children' component={Text}>
        save
      </Button>,
      <Button key='inner-native' component={Labeled} label='go' href='/docs'>
        go
      </Button>,
      <Button key='inner-custom' component={Icon} name='star' />,
      // @ts-expect-error href is not a prop of Text's default span
      <Button key='invalid-native' component={Text} href='/docs' />,
      // @ts-expect-error label is required by Labeled
      <Button key='missing-custom' component={Labeled} />,
      // @ts-expect-error name is required by Icon
      <Button key='missing-icon-name' component={Icon} />,
    ];

    expect(elements).toHaveLength(6);

    render(elements[0]);
    expect(screen.getByText("save").tagName).toBe("SPAN");
  });
});
