import { createComponent as createComponentFactory } from "@react-forge/core";

import type { CreateComponentFactoryOptions } from "@react-forge/core";
import type { ElementType } from "react";

export const createComponent = <
  TCustomProps extends Record<string, unknown> = Record<never, never>,
>() => {
  const factory = createComponentFactory<TCustomProps>();

  return <
    TElement extends ElementType = "div",
    TPolymorphic extends boolean = true,
  >(
    options: CreateComponentFactoryOptions<TElement, TCustomProps> & {
      polymorphic?: TPolymorphic;
    },
  ) =>
    factory({
      // For example, for some reason, we want to enable memoization for all components.
      memo: true,
      ...options,
    });
};

type ComponentOptions<TElement extends ElementType, TCustomProps> = Omit<
  CreateComponentFactoryOptions<TElement, TCustomProps>,
  "polymorphic"
>;

export const createPolymorphicComponent = <
  TCustomProps extends Record<string, unknown> = Record<never, never>,
>() => {
  const factory = createComponentFactory<TCustomProps>();

  return <TElement extends ElementType = "div">(
    options: ComponentOptions<TElement, TCustomProps>,
  ) => factory<TElement, true>({ ...options, polymorphic: true });
};

export const createStrictComponent = <
  TCustomProps extends Record<string, unknown> = Record<never, never>,
>() => {
  const factory = createComponentFactory<TCustomProps>();

  return <TElement extends ElementType = "div">(
    options: ComponentOptions<TElement, TCustomProps>,
  ) => factory<TElement, false>({ ...options, polymorphic: false });
};
