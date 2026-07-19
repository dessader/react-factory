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
    name,
    memo,
    polymorphic,
    Render,
  }: CreateComponentFactoryOptions<TElement, TCustomProps> & {
    polymorphic?: TPolymorphic;
  }) => {
    const resolvedElement = element ?? ("div" as TElement);
    const resolvedName = name ?? getComponentDisplayName(resolvedElement);

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

      const result = Render(
        resolvedComponent as TElement,
        cleanedProps as unknown as CreateComponentFactoryResolvedComponentProps<
          TElement,
          TCustomProps
        >,
      );

      if (result instanceof Promise) {
        return result.then((resolved) =>
          isValidElement(resolved)
            ? cloneElement(resolved, {
                "data-component": resolvedName,
              } as never)
            : resolved,
        );
      }

      if (isValidElement(result)) {
        return cloneElement(result, {
          "data-component": resolvedName,
        } as never);
      }

      return result;
    };

    FactoryComponent.displayName = resolvedName;

    if (memo) {
      const MemoizedFactoryComponent = reactMemo(
        FactoryComponent,
        typeof memo === "function" ? memo : undefined,
      );

      MemoizedFactoryComponent.displayName = resolvedName;

      return MemoizedFactoryComponent as typeof FactoryComponent;
    }
    return FactoryComponent;
  };
};
