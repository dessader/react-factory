import { render, screen } from "@testing-library/react";
import { createContext } from "../create-context.factory";

describe("createContext: defaultValue", () => {
  /**
   * No defaultValue means no fallback, so a missing Provider throws
   * outright.
   */
  it("throws when read outside a Provider and no defaultValue was given", () => {
    const [, useCounterContext] = createContext<{ count: number }>(
      "Counter",
    );
    const Consumer = () => <span>{useCounterContext("Consumer").count}</span>;

    expect(() => render(<Consumer />)).toThrow(
      "Consumer must be rendered within Counter",
    );
  });

  /**
   * defaultValue exists for exactly this case: no Provider is mounted,
   * and the hook still returns something instead of throwing.
   */
  it("falls back to defaultValue when read outside a Provider", () => {
    const [, useCounterContext] = createContext<{ count: number }>(
      "Counter",
      { count: 0 },
    );
    const Consumer = () => <span>{useCounterContext("Consumer").count}</span>;

    render(<Consumer />);

    expect(screen.getByText("0")).toBeInTheDocument();
  });

  /**
   * `null` is a legitimate defaultValue for `ContextType extends object |
   * null`. Reading it outside a Provider returns `null` instead of
   * throwing, because the fallback exists and nothing here counts as
   * missing.
   */
  it("accepts null as a defaultValue and never throws for it", () => {
    const [, useCounterContext] = createContext<{ count: number } | null>(
      "Counter",
      null,
    );
    const Consumer = () => {
      const value = useCounterContext("Consumer");
      return <span>{value === null ? "null" : value.count}</span>;
    };

    render(<Consumer />);

    expect(screen.getByText("null")).toBeInTheDocument();
  });
});
