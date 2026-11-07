import { createComponent } from "./create-component.factory";

import type {
  CreateComponentFactoryDefaultOptions,
  CreateComponentFactoryOptions,
  CreateComponentFactoryPolymorphicOption,
} from "./create-component.types";
import type { ElementType } from "react";

/**
 * Creates a new instance of the `createComponent` factory.
 * It accepts the same parameters as `createComponent`, with the exception of `Render`,
 * since that property is specific to one component and unknown at the time the factory is created.
 *
 * Per-component options always take precedence over the defaults: the
 * runtime merge spreads `defaultOptions` first and `options` second, so
 * `{ memo: false }` on one component overrides a local factory-wide
 * `memo: true`.
 *
 * @typeParam TDefaultElement - The default host tag or component every
 * component from the resulting local factory renders, unless it overrides
 * `element` itself. Defaults to `"div"`.
 * @typeParam TDefaultPolymorphic - The default `polymorphic` option for
 * components from the resulting local factory: `true`, `false`, or an
 * allow-list array. Defaults to `true`. A component that sets its own
 * `polymorphic` replaces the default entirely (lists are not merged); its
 * own `element` is always allowed in addition to a default allow-list.
 * @param defaultOptions - Defaults for `element`, `memo`, and
 * `polymorphic`. See {@link CreateComponentFactoryDefaultOptions}.
 * @returns A function with the same shape as `createComponent`: call it
 * with a `TCustomProps` type argument to get back a factory function for
 * one component, pre-filled with `defaultOptions`.
 *
 * @example
 * ```tsx
 * // lib/create-component.ts
 * const localCreateComponent = defineCreateComponent({ memo: true });
 *
 * // components/button.tsx
 * type ButtonProps = {
 *   variant: string;
 * };
 *
 * // Memoized by default, since the local factory sets memo: true.
 * const Button = localCreateComponent<ButtonProps>()({
 *   element: "button",
 *   Render: (Component, { variant, ...props }) => (
 *     <Component data-variant={variant} {...props} />
 *   ),
 * });
 * ```
 */
export const defineCreateComponent = <
  TDefaultElement extends ElementType = "div",
  const TDefaultPolymorphic extends CreateComponentFactoryPolymorphicOption =
    true,
>(
  defaultOptions?: CreateComponentFactoryDefaultOptions<TDefaultElement> & {
    polymorphic?: TDefaultPolymorphic;
  },
) => {
  return <
    TCustomProps extends Record<string, unknown> = Record<never, never>,
  >() => {
    const factory = createComponent<TCustomProps>();

    return <
      TElement extends ElementType = TDefaultElement,
      const TPolymorphic extends CreateComponentFactoryPolymorphicOption =
        TDefaultPolymorphic,
    >(
      options: CreateComponentFactoryOptions<TElement, TCustomProps> & {
        polymorphic?: TPolymorphic;
      },
    ) =>
      factory<TElement, TPolymorphic>({
        ...(defaultOptions as unknown as CreateComponentFactoryOptions<
          TElement,
          TCustomProps
        >),
        ...options,
      } as CreateComponentFactoryOptions<TElement, TCustomProps> & {
        polymorphic?: TPolymorphic;
      });
  };
};
