import { render, screen } from "@testing-library/react";
import { createComponent } from "../create-component.factory";

import type { ElementType } from "react";

describe("createComponent — polymorphic", () => {
  /**
   * `polymorphic` defaults to `true`, so a `component` prop must be
   * honored even without explicitly opting in — it should swap the
   * rendered tag and record what it resolved to.
   */
  it("is polymorphic by default and honors an explicit component prop", () => {
    const Box = createComponent()({
      Render: (Component, props) => <Component {...props} />,
    });
    Box.displayName = "Box";

    render(<Box component='section'>content</Box>);

    const node = screen.getByText("content");
    expect(node.tagName).toBe("SECTION");
    expect(node).toHaveAttribute("data-resolved-component", "FactorySection");
    expect(node).toHaveAttribute("data-origin-component", "Box");
  });

  /**
   * `data-resolved-component` should only appear when polymorphism was
   * actually exercised. Being polymorphic-capable without a `component`
   * prop passed at render time must not add the attribute.
   */
  it("does not add data-resolved-component when polymorphic but no component prop is passed", () => {
    const Box = createComponent()({
      Render: (Component, props) => <Component {...props} />,
    });
    Box.displayName = "Box";

    render(<Box>content</Box>);

    const node = screen.getByText("content");
    expect(node.tagName).toBe("DIV");
    expect(node).not.toHaveAttribute("data-resolved-component");
    expect(node).toHaveAttribute("data-origin-component", "Box");
  });

  /**
   * With `polymorphic: false`, a `component` prop forced through via a
   * type-unsafe spread must be completely inert: no tag swap, and no
   * leftover `component` attribute leaking into the rendered DOM node.
   */
  it("ignores an explicit component prop and does not leak it into the DOM when polymorphic: false", () => {
    const StrictBox = createComponent()({
      polymorphic: false,
      Render: (Component, props) => <Component {...props} />,
    });
    StrictBox.displayName = "StrictBox";

    render(
      <StrictBox {...({ component: "section" } as unknown as object)}>
        content
      </StrictBox>,
    );

    const node = screen.getByText("content");
    expect(node.tagName).toBe("DIV");
    expect(node).not.toHaveAttribute("component");
    expect(node).not.toHaveAttribute("data-resolved-component");
    expect(node).toHaveAttribute("data-origin-component", "StrictBox");
  });

  /**
   * Sanity check that disabling polymorphism without ever supplying a
   * `component` prop produces an ordinary render, identical to a
   * non-polymorphic component that was never exercised.
   */
  it("behaves like a plain render when polymorphic: false and no component prop is passed", () => {
    const StrictBox = createComponent()({
      polymorphic: false,
      Render: (Component, props) => <Component {...props} />,
    });
    StrictBox.displayName = "StrictBox";

    render(<StrictBox>content</StrictBox>);

    const node = screen.getByText("content");
    expect(node.tagName).toBe("DIV");
    expect(node).not.toHaveAttribute("data-resolved-component");
  });

  /**
   * Confirms the exact contract `Render` is called under: it receives the
   * swapped-in element (not the original default) as its first argument,
   * and the `component` key itself is stripped from the forwarded props.
   */
  it("calls Render with the swapped element and strips `component` from the forwarded props", () => {
    const renderSpy = vi.fn((Component: ElementType, props: object) => (
      <Component {...props} />
    ));

    const Box = createComponent<{ label?: string }>()({
      Render: renderSpy,
    });

    render(
      <Box component='span' label='x'>
        content
      </Box>,
    );

    expect(renderSpy).toHaveBeenCalledWith(
      "span",
      expect.objectContaining({ label: "x", children: "content" }),
    );

    const calledProps = renderSpy.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(calledProps).not.toHaveProperty("component");
  });
});
