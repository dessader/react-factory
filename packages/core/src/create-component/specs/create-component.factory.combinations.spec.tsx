import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import { createComponent } from "../create-component.factory";

describe("createComponent — cross-combinations", () => {
  /**
   * `memo` and polymorphic composition are independent features that must
   * not interfere with each other: displayName, origin/resolved tagging,
   * and the actual re-render skip must all be correct at the same time.
   */
  it("memo and polymorphic composition work together: correct displayName and data-resolved-component simultaneously", () => {
    const Inner = createComponent()({
      Render: (Tag, props) => <Tag {...props} />,
    });
    Inner.displayName = "Inner";

    const renderSpy = vi.fn();
    const Outer = createComponent()({
      element: "span",
      memo: true,
      Render: (Tag, props) => {
        renderSpy();

        return <Tag {...props} />;
      },
    });
    Outer.displayName = "Outer";

    const { rerender } = render(<Outer component={Inner}>content</Outer>);

    expect(Outer.displayName).toBe("Outer");
    const node = screen.getByText("content");
    expect(node.tagName).toBe("DIV");
    expect(node).toHaveAttribute("data-origin-component", "Outer");
    expect(node).toHaveAttribute("data-resolved-component", "Inner");
    expect(renderSpy).toHaveBeenCalledTimes(1);

    rerender(<Outer component={Inner}>content</Outer>);
    expect(renderSpy).toHaveBeenCalledTimes(1);
  });

  /**
   * A custom compare function must keep working normally even when the
   * component it's attached to has polymorphism turned off — the two
   * options operate on independent parts of the factory.
   */
  it("keeps a custom compare function working when polymorphic is disabled", () => {
    const renderSpy = vi.fn();

    const Box = createComponent<{ counter: number; label: string }>()({
      polymorphic: false,
      memo: (prev, next) => prev.label === next.label,
      Render: (Tag, { counter, label, ...rest }) => {
        renderSpy();

        return (
          <Tag {...rest}>
            {label}-{counter}
          </Tag>
        );
      },
    });

    const { rerender } = render(<Box counter={1} label='a' />);
    expect(renderSpy).toHaveBeenCalledTimes(1);

    rerender(<Box counter={2} label='a' />);
    expect(renderSpy).toHaveBeenCalledTimes(1);

    rerender(<Box counter={2} label='b' />);
    expect(renderSpy).toHaveBeenCalledTimes(2);
  });

  /**
   * When `element` is a component reference and polymorphism is never
   * exercised, `Render` must receive that exact same reference — not a
   * stringified or otherwise transformed version of it.
   */
  it("resolves to the exact original component reference (not stringified) when element is a component and no component prop swaps it", () => {
    const Inner = () => null;
    Inner.displayName = "Inner";

    const renderSpy = vi.fn(() => null);

    const Wrapped = createComponent()({
      element: Inner,
      Render: renderSpy,
    });

    (Wrapped as unknown as (props: unknown) => unknown)({});

    expect(renderSpy).toHaveBeenCalledWith(Inner, expect.anything());
  });

  /**
   * `memo` wrapping must not interfere with an async `Render`: the
   * underlying render logic (reached via `.type`, since the memo wrapper
   * object itself isn't callable) should still return a Promise normally.
   */
  it("memo wrapping coexists with an async Render without conflict", async () => {
    const MemoAsync = createComponent<{ counter: number }>()({
      element: "p",
      memo: true,
      Render: async (Tag, props) => {
        await Promise.resolve();

        return createElement(Tag, props);
      },
    });
    MemoAsync.displayName = "MemoAsync";

    const internals = MemoAsync as unknown as {
      $$typeof?: symbol;
      type: (props: unknown) => unknown;
    };
    expect(internals.$$typeof).toBe(Symbol.for("react.memo"));

    const result = internals.type({ counter: 1 });
    expect(result).toBeInstanceOf(Promise);
    await result;
  });

  /**
   * The origin/resolved composition mechanism must work correctly using
   * purely auto-derived names too, not only when every component in the
   * chain has an explicit displayName override.
   */
  it("uses auto-derived displayNames, not just explicit overrides, correctly during composition", () => {
    const Inner = createComponent()({
      element: "span",
      Render: (Tag, props) => <Tag {...props} />,
    });

    const Outer = createComponent()({
      Render: (Tag, props) => <Tag {...props} />,
    });

    render(<Outer component={Inner}>content</Outer>);

    const node = screen.getByText("content");
    expect(node.tagName).toBe("SPAN");
    expect(node).toHaveAttribute("data-origin-component", "FactoryDiv");
    expect(node).toHaveAttribute("data-resolved-component", "FactorySpan");
  });
});
