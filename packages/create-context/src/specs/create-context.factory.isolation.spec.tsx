import { render, screen } from "@testing-library/react";
import { createContext } from "../create-context.factory";

describe("createContext: multiple contexts", () => {
  /**
   * Providing a value on one context must never leak into another's
   * hook, even when their Providers nest.
   */
  it("keeps independently created contexts from colliding", () => {
    const [Counter, useCounterContext] = createContext<{ count: number }>(
      "Counter",
    );
    const [Theme, useThemeContext] = createContext<{ mode: string }>(
      "Theme",
    );

    const Consumer = () => (
      <span>
        {useCounterContext("Consumer").count}-
        {useThemeContext("Consumer").mode}
      </span>
    );

    render(
      <Counter value={{ count: 7 }}>
        <Theme value={{ mode: "dark" }}>
          <Consumer />
        </Theme>
      </Counter>,
    );

    expect(screen.getByText("7-dark")).toBeInTheDocument();
  });
});
