import { memo as reactMemo, cloneElement, isValidElement } from "react";
import { getComponentDisplayName } from "./utils";

import type {
  CreateComponentFactoryOptions,
  CreateComponentFactoryComponentProps,
  CreateComponentFactoryResolvedComponentProps,
} from "./create-component.types";
import type { ElementType, ReactNode } from "react";

/**
 * Creates a React component factory bound to a custom props shape.
 *
 * This is a curried API: `createComponent<TCustomProps>()` returns a second
 * function that accepts the actual {@link CreateComponentFactoryOptions}
 * (`element`, `memo`, `polymorphic`, `Render`) and produces the component.
 *
 * The produced component:
 * - Renders through the supplied `Render` function, passing it the resolved
 *   element and cleaned-up props.
 * - Is polymorphic by default (`polymorphic: true`): an optional `component`
 *   prop lets callers swap the rendered element at call time.
 * - Tags its rendered output with `data-origin-component` (the first/outermost
 *   factory component in a composition chain) and, when polymorphism was
 *   exercised, `data-resolved-component` (what it resolved to).
 * - Can optionally be wrapped in `React.memo` via the `memo` option.
 * - Automatically forwards `ref` to the resolved element. The factory's props
 *   type is derived via `ComponentPropsWithRef`, so `ref` is accepted as a
 *   plain prop and passed straight through to whatever
 *   `Render` renders.
 *
 * @typeParam TCustomProps - The custom prop shape every component created
 * by this factory accepts, in addition to the resolved element's own props.
 * @returns A function that accepts {@link CreateComponentFactoryOptions} and
 * returns the resulting React component.
 *
 * @example
 * ```tsx
 * type TextProps = {
 *   tone: string;
 * };
 *
 * const Text = createComponent<TextProps>()({
 *   element: "p",
 *   Render: (Component, { tone, ...props }) => (
 *     <Component data-tone={tone} {...props} />
 *   ),
 * });
 *
 * Text.displayName = "Text";
 * ```
 */
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

    /**
     * Tags a `Render` result with the origin/resolved data attributes.
     *
     * `data-resolved-component` always reflects the innermost factory
     * component (closest to the host element), since its own tag runs last
     * and overwrites any outer wrapper's value. `data-origin-component` is
     * only set when absent, so it keeps the outermost factory component's
     * name when one factory component renders as another via `component`.
     *
     * Both attributes read `FactoryComponent.displayName` live, not a value
     * frozen at creation time. Reassigning it after `createComponent()`
     * returns (the standard React convention) is honored on every render,
     * even for a memoized component.
     *
     * @param node - The value returned (or resolved) from `Render`.
     * @param resolvedComponentName - The name to record as
     * `data-resolved-component`, or `undefined` if polymorphism wasn't
     * exercised for this call.
     * @returns `node` unchanged if it isn't a valid React element,
     * otherwise a clone of `node` with the data attributes applied.
     */
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

    /**
     * The component produced by this call to `createComponent()(...)`.
     *
     * Resolves the polymorphic `component` prop (if `polymorphic` is
     * enabled and one was supplied), strips it out of the forwarded props,
     * invokes `Render`, and tags the result. Handles both synchronous
     * results and `Promise<ReactNode>` (async Server Components).
     *
     * @typeParam TAs - The element resolved for this render call.
     */
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
