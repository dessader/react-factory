import { createContext } from "../create-context.factory";

describe("createContext", () => {
  /**
   * The factory always returns a tuple: a Provider component first, a
   * reader hook second. Callers destructure and rename both.
   */
  it("returns a [Provider, useContext] tuple", () => {
    const [Counter, useCounterContext] = createContext<{ count: number }>(
      "Counter",
    );

    expect(typeof Counter).toBe("function");
    expect(typeof useCounterContext).toBe("function");
  });

  /**
   * Two contexts created from separate calls never share an identity.
   * The behavioral isolation check lives in isolation.spec.tsx.
   */
  it("creates a distinct Provider component per call", () => {
    const [Counter] = createContext<{ count: number }>("Counter");
    const [Theme] = createContext<{ mode: string }>("Theme");

    expect(Counter).not.toBe(Theme);
  });
});
