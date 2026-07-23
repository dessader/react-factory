import { render, screen } from "@testing-library/react";
import { createComponent } from "../create-component.factory";

import type { ReactNode } from "react";

describe("createComponent — composition of factory components", () => {
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
   * the very first caller across the whole chain, while resolved must
   * track the most recent activation rather than an intermediate step.
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
   * doesn't, the chain degrades gracefully to the inner component's own
   * identity instead of crashing or silently mis-tagging the DOM node.
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
});
