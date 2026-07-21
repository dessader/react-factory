import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useState } from "react";
import { createComponent } from "./create-component.factory";

describe("createComponent (DOM rendering)", () => {
  it("renders the resolved host element with the expected content", () => {
    const Text = createComponent()({
      element: "p",
      Render: (Tag, props) => <Tag {...props} />,
    });
    Text.displayName = "Text";

    render(<Text>hello</Text>);

    const node = screen.getByText("hello");
    expect(node.tagName).toBe("P");
    expect(node).toHaveAttribute("data-origin-component", "Text");
  });

  it("falls back to an auto-derived displayName when it is not set explicitly", () => {
    const Box = createComponent()({
      element: "div",
      Render: (Tag, props) => <Tag {...props} />,
    });

    render(<Box>fallback name</Box>);

    expect(Box.displayName).toBe("FactoryDiv");
    expect(screen.getByText("fallback name")).toHaveAttribute(
      "data-origin-component",
      "FactoryDiv",
    );
  });

  it("reflects a displayName reassigned after creation, even when memoized", () => {
    const MemoBox = createComponent()({
      element: "div",
      memo: true,
      Render: (Tag, props) => <Tag {...props} />,
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

  it("skips re-rendering a memoized component when props are unchanged", async () => {
    const user = userEvent.setup();
    const renderSpy = vi.fn();

    const MemoBox = createComponent<{ counter: number }>()({
      element: "div",
      memo: true,
      Render: (Tag, { counter, ...rest }) => {
        renderSpy();

        return <Tag {...rest}>{counter}</Tag>;
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

    // The parent re-rendered, but MemoBox's own props (counter) did not
    // change, so React.memo should have skipped calling Render again.
    expect(renderSpy).toHaveBeenCalledTimes(1);
  });

  it("re-renders a memoized component when props change", async () => {
    const renderSpy = vi.fn();

    const MemoBox = createComponent<{ counter: number }>()({
      element: "div",
      memo: true,
      Render: (Tag, { counter, ...rest }) => {
        renderSpy();

        return <Tag {...rest}>{counter}</Tag>;
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
