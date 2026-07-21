import { memo as reactMemo, cloneElement, isValidElement } from "react";
import { getComponentDisplayName } from "../utils";

import type {
  CreateComponentFactoryOptions,
  CreateComponentFactoryComponentProps,
  CreateComponentFactoryResolvedComponentProps,
} from "./create-component.types";
import type { ElementType, ReactNode } from "react";

export const createComponent = <
  TCustomProps extends Record<string, unknown> = Record<never, never>,
>() => {
  return <
    TElement extends ElementType = "div",
    TPolymorphic extends boolean = true,
  >({
    element,
    memo,
    polymorphic = true as TPolymorphic,
    Render,
  }: CreateComponentFactoryOptions<TElement, TCustomProps> & {
    polymorphic?: TPolymorphic;
  }) => {
    const resolvedElement = element ?? ("div" as TElement);

    const tagResolvedComponent = (
      node: ReactNode,
      resolvedComponentName: string | undefined,
    ): ReactNode => {
      if (!isValidElement(node)) {
        return node;
      }

      const existingOrigin = (node.props as Record<string, unknown>)[
        "data-origin-component"
      ];

      return cloneElement(node, {
        ...(resolvedComponentName !== undefined && {
          "data-resolved-component": resolvedComponentName,
        }),
        "data-origin-component":
          typeof existingOrigin === "string"
            ? existingOrigin
            : FactoryComponent.displayName,
      } as never);
    };

    const FactoryComponent = <TAs extends ElementType = TElement>(
      props: CreateComponentFactoryComponentProps<
        TAs,
        TCustomProps,
        TPolymorphic
      >,
    ): ReactNode => {
      const { component, ...cleanedProps } = props as {
        component?: TAs;
      } & object;

      const resolvedComponent = polymorphic
        ? (component ?? resolvedElement)
        : resolvedElement;

      const resolvedComponentName =
        polymorphic && component !== undefined
          ? getComponentDisplayName(resolvedComponent)
          : undefined;

      const result = Render(
        resolvedComponent as TElement,
        cleanedProps as unknown as CreateComponentFactoryResolvedComponentProps<
          TElement,
          TCustomProps
        >,
      );

      return result instanceof Promise
        ? result.then((node) =>
            tagResolvedComponent(node, resolvedComponentName),
          )
        : tagResolvedComponent(result, resolvedComponentName);
    };

    FactoryComponent.displayName = getComponentDisplayName(resolvedElement);

    if (memo) {
      const MemoizedFactoryComponent = reactMemo(
        FactoryComponent,
        typeof memo === "function" ? memo : undefined,
      );

      Object.defineProperty(MemoizedFactoryComponent, "displayName", {
        get: () => FactoryComponent.displayName,
        set: (value: string) => {
          FactoryComponent.displayName = value;
        },
        enumerable: true,
        configurable: true,
      });

      return MemoizedFactoryComponent as typeof FactoryComponent;
    }
    return FactoryComponent;
  };
};
