import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { createElement, isValidElement, useState } from "react";
import { createComponent } from "../create-component.factory";

describe("createComponent (DOM rendering)", () => {
  /**
   * End-to-end sanity check: rendering a component created by the factory
   * through a real React tree produces the expected host tag, content,
   * and the `data-origin-component` tagging attribute.
   */
  it("renders the resolved host element with the expected content", () => {
    const Text = createComponent()({
      element: "p",
      Render: (Component, props) => <Component {...props} />,
    });
    Text.displayName = "Text";

    render(<Text>hello</Text>);

    const node = screen.getByText("hello");
    expect(node.tagName).toBe("P");
    expect(node).toHaveAttribute("data-origin-component", "Text");
  });

  /**
   * Without an explicit displayName override, the component must fall
   * back to an auto-derived name, and that same name must show up both
   * on the component reference and in the rendered DOM attribute.
   */
  it("falls back to an auto-derived displayName when it is not set explicitly", () => {
    const Box = createComponent()({
      Render: (Component, props) => <Component {...props} />,
    });

    render(<Box>fallback name</Box>);

    expect(Box.displayName).toBe("FactoryDiv");
    expect(screen.getByText("fallback name")).toHaveAttribute(
      "data-origin-component",
      "FactoryDiv",
    );
  });

  /**
   * `displayName` can be reassigned after `createComponent()` returns
   * (the standard React convention). This must be honored live, on the
   * next render, even for a memoized component where the reassignment
   * happens on a wrapper object distinct from the inner render function.
   */
  it("reflects a displayName reassigned after creation, even when memoized", () => {
    const MemoBox = createComponent()({
      memo: true,
      Render: (Component, props) => <Component {...props} />,
    });

    MemoBox.displayName = "InitialName";
    render(<MemoBox>first render</MemoBox>);
    expect(screen.getByText("first render")).toHaveAttribute(
      "data-origin-component",
      "InitialName",
    );

    MemoBox.displayName = "RenamedAfterCreation";
    expect(MemoBox.displayName).toBe("RenamedAfterCreation");
  });

  /**
   * The most important real-world proof that `memo: true` works: when a
   * parent re-renders but a memoized component's own props are unchanged,
   * its `Render` must not run again.
   */
  it("skips re-rendering a memoized component when props are unchanged", async () => {
    const user = userEvent.setup();
    const renderSpy = vi.fn();

    const MemoBox = createComponent<{ counter: number }>()({
      memo: true,
      Render: (Component, { counter, ...rest }) => {
        renderSpy();

        return <Component {...rest}>{counter}</Component>;
      },
    });
    MemoBox.displayName = "MemoBox";

    const Wrapper = () => {
      const [, forceRerender] = useState(0);

      return (
        <>
          <button onClick={() => forceRerender((value) => value + 1)}>
            rerender
          </button>
          <MemoBox counter={1} />
        </>
      );
    };

    render(<Wrapper />);
    expect(renderSpy).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button"));

    expect(renderSpy).toHaveBeenCalledTimes(1);
  });

  /**
   * Complements the previous case: a memoized component must still
   * re-render (and reflect the new content) once its own props actually
   * change.
   */
  it("re-renders a memoized component when props change", async () => {
    const renderSpy = vi.fn();

    const MemoBox = createComponent<{ counter: number }>()({
      memo: true,
      Render: (Component, { counter, ...rest }) => {
        renderSpy();

        return <Component {...rest}>{counter}</Component>;
      },
    });
    MemoBox.displayName = "MemoBox";

    const { rerender } = render(<MemoBox counter={1} />);
    expect(renderSpy).toHaveBeenCalledTimes(1);

    rerender(<MemoBox counter={2} />);
    expect(renderSpy).toHaveBeenCalledTimes(2);
    expect(screen.getByText("2")).toBeInTheDocument();
  });
});

describe("createComponent: Render return value handling", () => {
  /**
   * `Render` isn't limited to returning host elements. A composite
   * (component) element must be tagged the same way a plain host element
   * would be.
   */
  it("renders a composite element result and tags it like a host element", () => {
    const Inner = ({
      label,
      ...props
    }: {
      label: string;
      children?: React.ReactNode;
    }) => (
      <span data-testid='inner' {...props}>
        {label}
      </span>
    );

    const Box = createComponent<{ label: string }>()({
      Render: (_Tag, { label, ...rest }) => <Inner label={label} {...rest} />,
    });
    Box.displayName = "Box";

    render(<Box label='composite' />);

    const node = screen.getByTestId("inner");
    expect(node).toHaveTextContent("composite");
    expect(node).toHaveAttribute("data-origin-component", "Box");
  });

  /**
   * When `Render` returns a plain string, there is no element to attach
   * data attributes to. It must come through untouched, with no wrapper
   * element introduced around it.
   */
  it("returns a string as-is, without a wrapper or data attributes", () => {
    const PlainText = createComponent<{ text: string }>()({
      Render: (_Tag, { text }) => text,
    });
    PlainText.displayName = "PlainText";

    const { container } = render(<PlainText text='just text' />);

    expect(container).toHaveTextContent("just text");
    expect(container.querySelector("[data-origin-component]")).toBeNull();
  });

  /**
   * A `Render` that intentionally renders nothing (`null`) must not throw
   * and must not produce any DOM output.
   */
  it("returns null without throwing and without rendering anything", () => {
    const Empty = createComponent()({
      Render: () => null,
    });

    const { container } = render(<Empty />);

    expect(container).toBeEmptyDOMElement();
  });

  /**
   * Same guarantee as the `null` case, but for `undefined`. Both are
   * valid "render nothing" signals in React.
   */
  it("returns undefined without throwing and without rendering anything", () => {
    const Empty = createComponent()({
      Render: () => undefined,
    });

    const { container } = render(<Empty />);

    expect(container).toBeEmptyDOMElement();
  });

  /**
   * An array of elements has no single root to tag, so none of the
   * siblings should end up with the origin/resolved data attributes,
   * even though they still render correctly.
   */
  it("returns an array of elements without tagging any of them", () => {
    const List = createComponent()({
      Render: () => [<span key='a'>a</span>, <span key='b'>b</span>],
    });
    List.displayName = "List";

    const { container } = render(<List />);

    expect(screen.getByText("a")).toBeInTheDocument();
    expect(screen.getByText("b")).toBeInTheDocument();
    expect(container.querySelector("[data-origin-component]")).toBeNull();
  });

  /**
   * A Fragment is a valid React element but doesn't correspond to any
   * real DOM node, so the injected data attributes have nowhere to land.
   * The children must still render regardless.
   */
  it("returns a Fragment; its children render, but no DOM node carries the data attributes", () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const FragmentBox = createComponent()({
      Render: () => (
        <>
          <span>x</span>
          <span>y</span>
        </>
      ),
    });
    FragmentBox.displayName = "FragmentBox";

    const { container } = render(<FragmentBox />);

    expect(screen.getByText("x")).toBeInTheDocument();
    expect(screen.getByText("y")).toBeInTheDocument();
    expect(container.querySelector("[data-origin-component]")).toBeNull();

    consoleErrorSpy.mockRestore();
  });

  /**
   * The factory must not swallow errors: an exception thrown synchronously
   * inside `Render` should propagate all the way out, unmodified, so
   * consumers can handle it with a normal React error boundary.
   */
  it("propagates a synchronous exception thrown by Render", () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const Throwing = createComponent()({
      Render: () => {
        throw new Error("boom");
      },
    });

    expect(() => render(<Throwing />)).toThrow("boom");

    consoleErrorSpy.mockRestore();
  });

  /**
   * `Render` may return a Promise (for async Server Components support).
   * Plain client rendering (react-dom/client, which @testing-library/react
   * uses) does not support components that return a Promise directly;
   * that's a Server Components/RSC-only capability. So this branch is
   * exercised via a direct function call instead of render(), confirming
   * the resolved element still gets tagged.
   */
  it("resolves a Promise<ReactNode> and tags the resolved valid element", async () => {
    const AsyncGreeting = createComponent()({
      element: "p",
      Render: async (Component, props) => {
        await Promise.resolve();

        return createElement(Component, props);
      },
    });
    AsyncGreeting.displayName = "AsyncGreeting";

    const result = AsyncGreeting({ children: "hi" } as never);
    expect(result).toBeInstanceOf(Promise);

    const resolved = await (result as Promise<unknown>);
    expect(isValidElement(resolved)).toBe(true);
    expect((resolved as { props: Record<string, unknown> }).props).toEqual(
      expect.objectContaining({
        "data-origin-component": "AsyncGreeting",
        children: "hi",
      }),
    );
  });

  /**
   * Complements the previous case: when the resolved value of an async
   * `Render` isn't a valid element, it must be returned as-is, with no
   * attempt to tag it.
   */
  it("resolves a Promise<ReactNode> to a non-element value and returns it as-is", async () => {
    const AsyncText = createComponent()({
      element: "p",
      Render: async () => {
        await Promise.resolve();

        return "plain resolved text";
      },
    });

    const result = AsyncText({} as never);
    const resolved = await (result as Promise<unknown>);

    expect(resolved).toBe("plain resolved text");
  });

  /**
   * A rejected Promise from an async `Render` must propagate as a
   * rejection, not be silently swallowed or converted into something
   * else, so callers can handle it (e.g. via Suspense + an error boundary).
   */
  it("propagates a rejected Promise from an async Render", async () => {
    const FailingAsync = createComponent()({
      element: "p",
      Render: async () => {
        await Promise.reject(new Error("async boom"));
      },
    });

    const result = FailingAsync({} as never);

    await expect(result as Promise<unknown>).rejects.toThrow("async boom");
  });
});
