import { render, screen } from "@testing-library/react";
import { createContext } from "../create-context.factory";

describe("createContext: the optional flag", () => {
  /**
   * The baseline for the flag: with no Provider and nothing to read,
   * `optional` swaps the throw for `undefined`.
   */
  it("returns undefined instead of throwing when nothing is found", () => {
    const [, useCounterContext] = createContext<{ count: number }>(
      "Counter",
    );
    const Consumer = () => {
      const value = useCounterContext("Consumer", { optional: true });
      return <span>{value === undefined ? "undefined" : value.count}</span>;
    };

    expect(() => render(<Consumer />)).not.toThrow();
    expect(screen.getByText("undefined")).toBeInTheDocument();
  });

  /**
   * `optional` only changes what happens when nothing is found; a real
   * Provider still wins, and the flag never substitutes `undefined` for
   * an actual value.
   */
  it("still returns the real value when a Provider is present", () => {
    const [Counter, useCounterContext] = createContext<{ count: number }>(
      "Counter",
    );
    const Consumer = () => {
      const value = useCounterContext("Consumer", { optional: true });
      return <span>{value === undefined ? "undefined" : value.count}</span>;
    };

    render(
      <Counter value={{ count: 7 }}>
        <Consumer />
      </Counter>,
    );

    expect(screen.getByText("7")).toBeInTheDocument();
  });

  /**
   * `{ optional: true }` is the only typed way to opt out of the throw.
   * `CreateContextFactoryUseContext` requires the literal `true`, not
   * `boolean`, so there's no `{ optional: false }` to pass. Leaving the
   * second argument off entirely is how callers stay on the throwing path.
   */
  it("still throws when the options argument is left off", () => {
    const [, useCounterContext] = createContext<{ count: number }>(
      "Counter",
    );
    const Consumer = () => <span>{useCounterContext("Consumer").count}</span>;

    expect(() => render(<Consumer />)).toThrow(
      "Consumer must be rendered within Counter",
    );
  });
});
