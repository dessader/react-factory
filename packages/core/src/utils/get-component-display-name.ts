import type { ElementType } from "react";

/**
 * Derives a human-readable display name for a resolved element.
 *
 * Used as the default `displayName` for components created by
 * `createComponent` when no explicit name is assigned, and also to name
 * whatever a polymorphic `component` prop resolves to.
 *
 * - For intrinsic (string) elements, capitalizes the tag and prefixes it
 *   with `"Factory"` (e.g. `"div"` becomes `"FactoryDiv"`).
 * - For component elements, prefers `displayName`, falls back to the
 *   function's own `.name`, and finally to `"FactoryUnknownComponent"`
 *   when neither is available.
 *
 * @param element - The intrinsic tag or component to derive a name for.
 * @returns A non-empty display name string.
 */
export const getComponentDisplayName = (element: ElementType): string => {
  if (typeof element === "string") {
    return `Factory${element.charAt(0).toUpperCase()}${element.slice(1)}`;
  }

  return element.displayName ?? element.name ?? "FactoryUnknownComponent";
};
