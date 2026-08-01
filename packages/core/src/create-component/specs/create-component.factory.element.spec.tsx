import { render, screen } from "@testing-library/react";
import { useRef } from "react";
import { createComponent } from "../create-component.factory";

import type { ReactNode, Ref } from "react";

describe("createComponent: element & displayName resolution", () => {
  /**
   * When `element` is omitted entirely, the factory must fallback to a
   * plain "div" and derive its displayName from that default.
   */
  it("defaults to a div when element is not provided", () => {
    const Box = createComponent()({
      Render: (Component, props) => <Component {...props} />,
    });

    render(<Box>content</Box>);

    const node = screen.getByText("content");
    expect(node.tagName).toBe("DIV");
    expect(Box.displayName).toBe("FactoryDiv");
  });

  /**
   * An explicit intrinsic tag (a string other than the default "div")
   * renders as given, and the auto-derived name reflects that tag rather
   * than the default.
   */
  it("renders the given intrinsic tag", () => {
    const Button = createComponent()({
      element: "button",
      Render: (Component, props) => <Component {...props} />,
    });

    render(<Button>click me</Button>);

    expect(screen.getByText("click me").tagName).toBe("BUTTON");
    expect(Button.displayName).toBe("FactoryButton");
  });

  /**
   * `element` isn't limited to intrinsic tags. A custom component must be
   * forwarded to `Render` untouched, and the factory's auto-naming should
   * reuse that component's own displayName instead of a generic fallback.
   */
  it("passes a custom component as element straight through to Render and reuses its displayName", () => {
    const Inner = (props: { children?: ReactNode }) => (
      <span data-testid='inner'>{props.children}</span>
    );
    Inner.displayName = "Inner";

    const Wrapped = createComponent()({
      element: Inner,
      Render: (Component, props) => <Component {...props} />,
    });

    render(<Wrapped>inner content</Wrapped>);

    expect(screen.getByTestId("inner")).toHaveTextContent("inner content");
    expect(Wrapped.displayName).toBe("Inner");
  });

  /**
   * This library only targets React 19+, where `ref` is accepted as a
   * plain prop on function components (forwardRef is not part of the
   * supported API). Confirms a `ref` passed through the factory still
   * reaches the underlying host node.
   */
  it("forwards refs when element accepts ref as a plain prop (React 19)", () => {
    const Inner = ({
      ref,
      ...props
    }: {
      ref?: Ref<HTMLInputElement>;
      placeholder?: string;
    }) => <input ref={ref} {...props} />;

    const InputBox = createComponent()({
      element: Inner,
      Render: (Component, props) => <Component {...props} />,
    });

    const RefProbe = () => {
      const ref = useRef<HTMLInputElement>(null);

      return <InputBox ref={ref} placeholder='probe' />;
    };

    render(<RefProbe />);

    expect(screen.getByPlaceholderText("probe").tagName).toBe("INPUT");
  });

  /**
   * A component element with no displayName and a forcibly empty `.name`
   * (simulating an anonymous function) must still resolve to a safe,
   * generic placeholder name instead of `undefined` or a crash.
   */
  it("falls back to FactoryUnknownComponent when the element has neither displayName nor a usable name", () => {
    const Anonymous = () => null;
    Object.defineProperty(Anonymous, "name", { value: undefined });

    const Wrapped = createComponent()({
      element: Anonymous,
      Render: (Component, props) => <Component {...props} />,
    });

    expect(Wrapped.displayName).toBe("FactoryUnknownComponent");
  });
});
