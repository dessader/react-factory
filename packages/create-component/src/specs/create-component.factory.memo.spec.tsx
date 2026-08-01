import { render, screen } from "@testing-library/react";
import { createComponent } from "../create-component.factory";

const REACT_MEMO_TYPE = Symbol.for("react.memo");

describe("createComponent: memo", () => {
  /**
   * Without `memo`, the returned component must be a plain function
   * component, not a `React.memo`-wrapped exotic component.
   */
  it("is not wrapped in React.memo when memo is not passed", () => {
    const Box = createComponent()({
      Render: (Component, props) => <Component {...props} />,
    });

    const internals = Box as unknown as { $$typeof?: symbol };
    expect(internals.$$typeof).not.toBe(REACT_MEMO_TYPE);
  });

  /**
   * `memo: true` should wrap the component in `React.memo` using its
   * default shallow-compare behavior (no custom comparator attached).
   */
  it("wraps in React.memo without a custom compare when memo: true", () => {
    const Box = createComponent()({
      memo: true,
      Render: (Component, props) => <Component {...props} />,
    });

    const internals = Box as unknown as {
      $$typeof?: symbol;
      compare?: unknown;
    };
    expect(internals.$$typeof).toBe(REACT_MEMO_TYPE);
    expect(internals.compare).toBeNull();
  });

  /**
   * When `memo` is given a comparator function, that exact function must
   * be the one `React.memo` ends up using for prop comparisons.
   */
  it("wraps in React.memo using the provided compare function", () => {
    const compare = vi.fn(() => true);

    const Box = createComponent()({
      memo: compare,
      Render: (Component, props) => <Component {...props} />,
    });

    const internals = Box as unknown as { compare?: unknown };
    expect(internals.compare).toBe(compare);
  });

  /**
   * Without memoization, a component must re-run its `Render` on every
   * parent re-render, even when its own props are unchanged. This is the
   * baseline behavior the other memo tests are contrasted against.
   */
  it("re-renders on every parent re-render when memo is not set", () => {
    const renderSpy = vi.fn();

    const Box = createComponent<{ counter: number }>()({
      Render: (Component, { counter, ...rest }) => {
        renderSpy();

        return <Component {...rest}>{counter}</Component>;
      },
    });

    const { rerender } = render(<Box counter={1} />);
    expect(renderSpy).toHaveBeenCalledTimes(1);

    rerender(<Box counter={1} />);
    expect(renderSpy).toHaveBeenCalledTimes(2);
  });

  /**
   * Proves a custom compare function changes reconciliation behavior at
   * runtime: when it reports props as equal despite `counter` changing,
   * `Render` must not run again and the DOM stays stale.
   */
  it("skips re-render when the custom compare function ignores the changed prop", () => {
    const renderSpy = vi.fn();

    const Box = createComponent<{ counter: number; label: string }>()({
      memo: (prev, next) => prev.label === next.label,
      Render: (Component, { counter, label, ...rest }) => {
        renderSpy();

        return (
          <Component {...rest}>
            {label}-{counter}
          </Component>
        );
      },
    });

    const { rerender } = render(<Box counter={1} label='a' />);
    expect(renderSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByText("a-1")).toBeInTheDocument();

    rerender(<Box counter={2} label='a' />);
    expect(renderSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByText("a-1")).toBeInTheDocument();
  });

  /**
   * Complements the previous case: when the custom compare function
   * detects a real change in the field it tracks (`label`), `Render`
   * must run again and the DOM must reflect the latest props.
   */
  it("re-renders when the custom compare function reports a change in the tracked field", () => {
    const renderSpy = vi.fn();

    const Box = createComponent<{ counter: number; label: string }>()({
      memo: (prev, next) => prev.label === next.label,
      Render: (Component, { counter, label, ...rest }) => {
        renderSpy();

        return (
          <Component {...rest}>
            {label}-{counter}
          </Component>
        );
      },
    });

    const { rerender } = render(<Box counter={1} label='a' />);
    expect(renderSpy).toHaveBeenCalledTimes(1);

    rerender(<Box counter={2} label='b' />);
    expect(renderSpy).toHaveBeenCalledTimes(2);
    expect(screen.getByText("b-2")).toBeInTheDocument();
  });
});
