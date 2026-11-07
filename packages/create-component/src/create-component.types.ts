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
 * Controls the polymorphic `component` prop of a factory component.
 *
 * - `true` accepts any intrinsic tag or component.
 * - `false` removes the `component` prop entirely.
 * - An array accepts only the listed tags and components, plus the
 *   factory's default `element`, which is always allowed. Anything else is a
 *   type error at the usage site and, in development, a runtime error.
 */
export type CreateComponentFactoryPolymorphicOption =
  boolean | readonly ElementType[];

/**
 * The union of elements a factory component's `component` prop accepts.
 *
 * Always includes `TElement`. On top of it, resolves to `ElementType` for
 * `true`, to the listed elements for an allow-list array, and to nothing
 * else for `false` (where the `component` prop is absent anyway).
 *
 * `TElement` sits at the top level of the union, outside the conditional,
 * so a generic `TAs extends CreateComponentFactoryAllowedElement<...>` can
 * still default to `TElement` while `TPolymorphic` is unresolved.
 *
 * @typeParam TElement - The factory's default element, always allowed.
 * @typeParam TPolymorphic - The factory's `polymorphic` option.
 */
export type CreateComponentFactoryAllowedElement<
  TElement extends ElementType,
  TPolymorphic extends CreateComponentFactoryPolymorphicOption,
> =
  | TElement
  | (TPolymorphic extends readonly (infer TAllowed extends ElementType)[]
      ? TAllowed
      : TPolymorphic extends false
        ? never
        : ElementType);

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
   * Whether, and to what, the resulting component's `component` prop can
   * swap the rendered element at call time. Defaults to `true`. See
   * {@link CreateComponentFactoryPolymorphicOption}.
   */
  polymorphic?: CreateComponentFactoryPolymorphicOption;
  /**
   * Produces the React output for the resolved element and props. See
   * {@link CreateComponentFactoryRenderFunction}.
   */
  Render: CreateComponentFactoryRenderFunction<TElement, TCustomProps>;
};

/**
 * Defaults accepted by `defineCreateComponent`.
 *
 * Same shape as {@link CreateComponentFactoryOptions}, without `Render`:
 * a `Render` function is specific to one component.
 *
 * `memo`, when supplied here, is typed loosely rather than against a
 * concrete `TCustomProps`. At the point `defineCreateComponent` is called,
 * no component's custom props shape exists yet. That's only fixed later,
 * per component, via `localCreateComponent<TCustomProps>()`, so a
 * comparator function set as a default is not type-checked against any
 * particular component's props.
 *
 * `element` stays fully supported here, typed against `TElement` exactly
 * like it is on {@link CreateComponentFactoryOptions}: it's the default
 * host tag or component for every component created from the resulting
 * local factory, unless a given component overrides it.
 *
 * @typeParam TElement - The default host tag or component every component
 * created from the resulting local factory renders unless it overrides
 * `element` itself.
 */
export type CreateComponentFactoryDefaultOptions<TElement extends ElementType> =
  Omit<
    CreateComponentFactoryOptions<TElement, Record<string, unknown>>,
    "Render"
  >;

/**
 * The props accepted by the component produced by the factory.
 *
 * When `TPolymorphic` is `true` (the default) or an allow-list array, an
 * optional `component` prop lets callers swap the rendered element for a
 * different intrinsic tag or component at call time. Which values it
 * accepts is constrained on the component itself, via
 * {@link CreateComponentFactoryAllowedElement}. When `TPolymorphic` is
 * `false`, the prop is absent.
 *
 * @typeParam TAs - The intrinsic tag or component being rendered for this
 * usage (may differ from the factory's default `element` when polymorphism
 * is exercised).
 * @typeParam TCustomProps - The factory's own custom prop shape.
 * @typeParam TPolymorphic - The factory's `polymorphic` option.
 */
export type CreateComponentFactoryComponentProps<
  TAs extends ElementType,
  TCustomProps,
  TPolymorphic extends CreateComponentFactoryPolymorphicOption = true,
> = TPolymorphic extends false
  ? CreateComponentFactoryResolvedComponentProps<TAs, TCustomProps>
  : {
      /** Swaps the rendered element for this call only. */
      component?: TAs;
    } & CreateComponentFactoryResolvedComponentProps<TAs, TCustomProps>;

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
