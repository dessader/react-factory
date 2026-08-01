import type { ComponentPropsWithRef, ElementType, ReactNode } from "react";

/**
 * The final props a factory component `Render` function receives.
 *
 * Combines `TCustomProps` with the resolved element's native props, excluded
 * `component` and any keys `TCustomProps` already defines (custom props
 * win on name conflicts).
 *
 * @typeParam TElement - The intrinsic tag or component being rendered.
 * @typeParam TCustomProps - The factory own custom prop shape.
 */
export type CreateComponentFactoryResolvedComponentProps<
  TElement extends ElementType,
  TCustomProps,
> = TCustomProps &
  Omit<ComponentPropsWithRef<TElement>, keyof TCustomProps | "component">;

/**
 * The render function supplied to `createComponent` as `Render`.
 *
 * Receives the resolved element (the intrinsic tag or component to render,
 * accounting for any polymorphic swap) and the cleaned-up props, then
 * produces the React output. Can return a plain `ReactNode`, or a
 * `Promise<ReactNode>` for async Server Components.
 *
 * @typeParam TElement - The intrinsic tag or component being rendered.
 * @typeParam TCustomProps - The factory's own custom prop shape.
 */
export type CreateComponentFactoryRenderFunction<
  TElement extends ElementType,
  TCustomProps,
> = (
  Component: TElement,
  props: CreateComponentFactoryResolvedComponentProps<TElement, TCustomProps>,
) => ReactNode;

/**
 * Controls whether and how a factory component is wrapped in `React.memo`.
 *
 * - `true` wraps the component using React's default shallow prop
 *   comparison.
 * - A {@link CreateComponentFactoryMemoFunction} wraps it using that
 *   function as the custom comparator.
 * - `false`/`undefined` (via `CreateComponentFactoryOptions.memo`) leaves
 *   the component unmemoized.
 *
 * @typeParam TElement - The intrinsic tag or component being rendered.
 * @typeParam TCustomProps - The factory's own custom prop shape.
 */
export type CreateComponentFactoryMemoOption<
  TElement extends ElementType,
  TCustomProps,
> = boolean | CreateComponentFactoryMemoFunction<TElement, TCustomProps>;

/**
 * Options accepted by the factory function returned from
 * `createComponent<TCustomProps>()`.
 *
 * @typeParam TElement - The intrinsic tag or component being rendered.
 * @typeParam TCustomProps - The factory's own custom prop shape.
 */
export type CreateComponentFactoryOptions<
  TElement extends ElementType,
  TCustomProps,
> = {
  /**
   * The default host tag or component to render when no polymorphic
   * `component` prop is supplied at call time. Defaults to `"div"`.
   */
  element?: TElement;
  /**
   * Wraps the resulting component in `React.memo`. See
   * {@link CreateComponentFactoryMemoOption}.
   */
  memo?: CreateComponentFactoryMemoOption<TElement, TCustomProps>;
  /**
   * Whether the resulting component accepts a `component` prop that swaps
   * the rendered element at call time. Defaults to `true`.
   */
  polymorphic?: boolean;
  /**
   * Produces the React output for the resolved element and props. See
   * {@link CreateComponentFactoryRenderFunction}.
   */
  Render: CreateComponentFactoryRenderFunction<TElement, TCustomProps>;
};

/**
 * The props accepted by the component produced by the factory.
 *
 * When `TPolymorphic` is `true` (the default), an optional `component`
 * prop lets callers swap the rendered element for a different intrinsic
 * tag or component at call time.
 *
 * @typeParam TAs - The intrinsic tag or component being rendered for this
 * usage (may differ from the factory's default `element` when polymorphism
 * is exercised).
 * @typeParam TCustomProps - The factory's own custom prop shape.
 * @typeParam TPolymorphic - Whether the `component` swap prop is included.
 */
export type CreateComponentFactoryComponentProps<
  TAs extends ElementType,
  TCustomProps,
  TPolymorphic extends boolean = true,
> = TPolymorphic extends true
  ? {
      /** Swaps the rendered element for this call only. */
      component?: TAs;
    } & CreateComponentFactoryResolvedComponentProps<TAs, TCustomProps>
  : CreateComponentFactoryResolvedComponentProps<TAs, TCustomProps>;

/**
 * A custom prop-comparison function for
 * {@link CreateComponentFactoryOptions.memo}, matching the signature
 * `React.memo` expects: return `true` to skip re-rendering (props are
 * considered equal), or `false` to re-render.
 *
 * @typeParam TElement - The intrinsic tag or component being rendered.
 * @typeParam TCustomProps - The factory's own custom prop shape.
 * @param prevProps - The props from the previous render.
 * @param nextProps - The props for the upcoming render.
 * @returns `true` if the component should skip re-rendering.
 */
export type CreateComponentFactoryMemoFunction<
  TElement extends ElementType,
  TCustomProps,
> = (
  prevProps: CreateComponentFactoryComponentProps<TElement, TCustomProps>,
  nextProps: CreateComponentFactoryComponentProps<TElement, TCustomProps>,
) => boolean;
