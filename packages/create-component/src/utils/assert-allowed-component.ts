import type { ElementType } from "react";

/**
 * Formats an element for an error message: a tag as `"a"`, a component by
 * its `displayName`, `.name`, or `"UnknownComponent"`.
 *
 * Uses `||` rather than `??`: an anonymous function has `.name === ""`,
 * which must fall through to the placeholder instead of printing nothing.
 *
 * @param element - The intrinsic tag or component to describe.
 * @returns A short human-readable label.
 */
const describeElement = (element: ElementType): string =>
  typeof element === "string"
    ? `"${element}"`
    : element.displayName || element.name || "UnknownComponent";

/**
 * Throws when a polymorphic `component` prop is not in the factory
 * component's allow-list.
 *
 * Development-only by contract: it does not check the environment itself.
 * The caller guards the call with `process.env.NODE_ENV !== "production"`
 * at the call site, as React does with `if (__DEV__)`, so bundlers replace
 * the condition with a constant and drop the call, and this function with
 * it, from production builds.
 *
 * The default `element` is always allowed. Comparison is by identity, which
 * also catches a component the type checker let through only because its
 * props are structurally identical to an allowed one.
 *
 * @param componentName - The factory component's `displayName`, for the
 * error message.
 * @param component - The value passed as the `component` prop.
 * @param defaultElement - The factory's default `element`.
 * @param allowedElements - The `polymorphic` allow-list.
 * @throws Error when `component` is neither `defaultElement` nor in
 * `allowedElements`.
 */
export const assertAllowedComponent = (
  componentName: string | undefined,
  component: ElementType,
  defaultElement: ElementType,
  allowedElements: readonly ElementType[],
): void => {
  if (component === defaultElement || allowedElements.includes(component)) {
    return;
  }

  const allowed = [defaultElement, ...allowedElements]
    .map(describeElement)
    .join(", ");

  throw new Error(
    `[create-component] ${componentName ?? "Component"} received component=${describeElement(component)}, which is not in its polymorphic allow-list. Allowed: ${allowed}.`,
  );
};
