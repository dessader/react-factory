import type { ElementType } from "react";

export const getComponentDisplayName = (element: ElementType): string => {
  if (typeof element === "string") {
    return `Factory${element.charAt(0).toUpperCase()}${element.slice(1)}`;
  }

  return element.displayName ?? element.name ?? "FactoryUnknownComponent";
};
