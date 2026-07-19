import type { ComponentPropsWithRef, ElementType, ReactNode } from "react";

export type CreateComponentFactoryResolvedComponentProps<
  TElement extends ElementType,
  TCustomProps,
> = TCustomProps &
  Omit<ComponentPropsWithRef<TElement>, keyof TCustomProps | "component">;

export type CreateComponentFactoryRenderFunction<
  TElement extends ElementType,
  TCustomProps,
> = (
  Component: TElement,
  props: CreateComponentFactoryResolvedComponentProps<TElement, TCustomProps>,
) => ReactNode;

export type CreateComponentFactoryMemoOption<
  TElement extends ElementType,
  TCustomProps,
> = boolean | CreateComponentFactoryMemoFunction<TElement, TCustomProps>;

export type CreateComponentFactoryOptions<
  TElement extends ElementType,
  TCustomProps,
> = {
  element?: TElement;
  name?: string;
  memo?: CreateComponentFactoryMemoOption<TElement, TCustomProps>;
  polymorphic?: boolean;
  Render: CreateComponentFactoryRenderFunction<TElement, TCustomProps>;
};

export type CreateComponentFactoryComponentProps<
  TAs extends ElementType,
  TCustomProps,
  TPolymorphic extends boolean = true,
> = TPolymorphic extends true
  ? {
      component?: TAs;
    } & CreateComponentFactoryResolvedComponentProps<TAs, TCustomProps>
  : CreateComponentFactoryResolvedComponentProps<TAs, TCustomProps>;

export type CreateComponentFactoryMemoFunction<
  TElement extends ElementType,
  TCustomProps,
> = (
  prevProps: CreateComponentFactoryComponentProps<TElement, TCustomProps>,
  nextProps: CreateComponentFactoryComponentProps<TElement, TCustomProps>,
) => boolean;
