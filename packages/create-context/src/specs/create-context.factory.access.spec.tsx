import { render, screen } from "@testing-library/react";
import { createContext } from "../create-context.factory";

describe("createContext: reading values from a Provider", () => {
  /**
   * The baseline case: a value passed to a real Provider is exactly what
   * the hook returns, unchanged.
   */
  it("returns the value supplied by the nearest Provider", () => {
    const [Counter, useCounterContext] = createContext<{ count: number }>(
      "Counter",
    );
    const Consumer = () => <span>{useCounterContext("Consumer").count}</span>;

    render(
      <Counter value={{ count: 42 }}>
        <Consumer />
      </Counter>,
    );

    expect(screen.getByText("42")).toBeInTheDocument();
  });

  /**
   * The guard checks `contextValue === undefined`, not truthiness. A
   * Provider can hand over `null`, a value the type system allows, and it
   * reads back exactly as passed instead of tripping the guard.
   */
  it("reads a Provider-supplied null without throwing", () => {
    const [Counter, useCounterContext] = createContext<{
      count: number;
    } | null>("Counter");
    const Consumer = () => {
      const value = useCounterContext("Consumer");
      return <span>{value === null ? "null" : value.count}</span>;
    };

    render(
      <Counter value={null}>
        <Consumer />
      </Counter>,
    );

    expect(screen.getByText("null")).toBeInTheDocument();
  });

  /**
   * A falsy property inside an object, like `count: 0`, is not a missing
   * context. Only the object reference itself, compared against
   * `undefined`, decides that.
   */
  it("reads an object value with a falsy property without throwing", () => {
    const [Counter, useCounterContext] = createContext<{ count: number }>(
      "Counter",
    );
    const Consumer = () => <span>{useCounterContext("Consumer").count}</span>;

    render(
      <Counter value={{ count: 0 }}>
        <Consumer />
      </Counter>,
    );

    expect(screen.getByText("0")).toBeInTheDocument();
  });

  /**
   * `consumer` names who asked; `host` names where the Provider should
   * be. Swapping them would send developers to the wrong component when
   * they debug a missing Provider.
   */
  it("names the consumer and the host in the right positions", () => {
    const [, useAccordionContext] = createContext<{ open: boolean }>(
      "Accordion",
    );
    const AccordionTrigger = () => (
      <span>{useAccordionContext("AccordionTrigger").open}</span>
    );

    expect(() => render(<AccordionTrigger />)).toThrow(
      "AccordionTrigger must be rendered within AccordionContextProvider",
    );
  });
});
