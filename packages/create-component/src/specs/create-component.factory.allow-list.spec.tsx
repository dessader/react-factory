import { render, screen } from "@testing-library/react";
import { createComponent } from "../create-component.factory";
import { defineCreateComponent } from "../define-create-component.factory";

type LabelProps = {
  label: string;
};

const Label = ({ label, ...props }: LabelProps) => <i {...props}>{label}</i>;
Label.displayName = "Label";

const Unlisted = ({ label, ...props }: LabelProps) => <b {...props}>{label}</b>;
Unlisted.displayName = "Unlisted";

const Counter = ({ count }: { count: number }) => <b>{count}</b>;

/**
 * Passes a `component` value past the type checker, to exercise the
 * runtime check with values the allow-list types already reject.
 */
const unsafeComponent = (component: unknown) =>
  ({ component }) as unknown as object;

describe("createComponent: polymorphic allow-list", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  /**
   * Every listed intrinsic tag must be accepted by `component`, swap the
   * rendered tag and record what it resolved to, exactly like an
   * unrestricted polymorphic component.
   */
  it("renders a listed intrinsic tag", () => {
    const Box = createComponent()({
      polymorphic: ["span", "a"],
      Render: (Component, props) => <Component {...props} />,
    });
    Box.displayName = "Box";

    render(
      <Box component='a' href='/docs'>
        content
      </Box>,
    );

    const node = screen.getByText("content");
    expect(node.tagName).toBe("A");
    expect(node).toHaveAttribute("href", "/docs");
    expect(node).toHaveAttribute("data-resolved-component", "FactoryA");
    expect(node).toHaveAttribute("data-origin-component", "Box");
  });

  /**
   * A listed component must be accepted and receive its own props.
   */
  it("renders a listed component", () => {
    const Box = createComponent()({
      polymorphic: ["span", Label],
      Render: (Component, props) => <Component {...props} />,
    });
    Box.displayName = "Box";

    render(<Box component={Label} label='content' />);

    const node = screen.getByText("content");
    expect(node.tagName).toBe("I");
    expect(node).toHaveAttribute("data-resolved-component", "Label");
  });

  /**
   * The default `element` is always allowed, both implicitly (no
   * `component` prop) and when passed explicitly, without being listed.
   */
  it("always allows the default element", () => {
    const Box = createComponent()({
      element: "p",
      polymorphic: ["span"],
      Render: (Component, props) => <Component {...props} />,
    });

    render(
      <>
        <Box>implicit</Box>
        <Box component='p'>explicit</Box>
      </>,
    );

    expect(screen.getByText("implicit").tagName).toBe("P");
    expect(screen.getByText("explicit").tagName).toBe("P");
  });

  /**
   * In development, an unlisted tag must throw with a message naming the
   * component, the rejected value and everything that is allowed.
   */
  it("throws in development for an unlisted intrinsic tag", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const Box = createComponent()({
      polymorphic: ["span", Label],
      Render: (Component, props) => <Component {...props} />,
    });
    Box.displayName = "Box";

    expect(() => render(<Box {...unsafeComponent("a")} />)).toThrow(
      '[create-component] Box received component="a", which is not in its polymorphic allow-list. Allowed: "div", "span", Label.',
    );
  });

  /**
   * TypeScript compares components structurally, so `Unlisted`, typed
   * identically to the listed `Label`, passes the type check. The runtime
   * check compares by identity and still rejects it.
   */
  it("throws in development for an unlisted component", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const Box = createComponent()({
      polymorphic: [Label],
      Render: (Component, props) => <Component {...props} />,
    });
    Box.displayName = "Box";

    expect(() => render(<Box component={Unlisted} label='content' />)).toThrow(
      /Box received component=Unlisted/,
    );
  });

  /**
   * In production the check is skipped entirely: an unlisted value renders
   * instead of throwing.
   */
  it("does not check the allow-list in production", () => {
    vi.stubEnv("NODE_ENV", "production");

    const Box = createComponent()({
      polymorphic: ["span"],
      Render: (Component, props) => <Component {...props} />,
    });

    render(<Box {...unsafeComponent("a")}>content</Box>);

    expect(screen.getByText("content").tagName).toBe("A");
  });

  /**
   * Type-level contract: only listed elements and the default element are
   * accepted, and native props follow the chosen element. Elements are only
   * created, never rendered, so the `@ts-expect-error` lines are checked by
   * the `typecheck` target alone.
   */
  it("restricts the component prop at the type level", () => {
    const Box = createComponent()({
      element: "p",
      polymorphic: ["span", "a", Label],
      Render: (Component, props) => <Component {...props} />,
    });

    const elements = [
      <Box key='default' />,
      <Box key='explicit-default' component='p' />,
      <Box key='tag' component='a' href='/docs' />,
      <Box key='component' component={Label} label='content' />,
      // @ts-expect-error "button" is not in the allow-list
      <Box key='unlisted-tag' component='button' />,
      // @ts-expect-error Counter is not in the allow-list
      <Box key='unlisted-component' component={Counter} count={1} />,
      // @ts-expect-error href is not a span prop
      <Box key='wrong-prop' component='span' href='/docs' />,
    ];

    expect(elements).toHaveLength(7);
  });
});

describe("defineCreateComponent: polymorphic allow-list", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * A project-wide allow-list must apply to every component from the local
   * factory, with each component's own `element` allowed on top of it.
   */
  it("applies a default allow-list to every component", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const createTextComponent = defineCreateComponent({
      polymorphic: ["span", Label],
    });

    const Text = createTextComponent()({
      element: "p",
      Render: (Component, props) => <Component {...props} />,
    });
    Text.displayName = "Text";

    render(
      <>
        <Text component='span'>listed</Text>
        <Text component='p'>own element</Text>
      </>,
    );

    expect(screen.getByText("listed").tagName).toBe("SPAN");
    expect(screen.getByText("own element").tagName).toBe("P");
    expect(() => render(<Text {...unsafeComponent("a")} />)).toThrow(
      /Text received component="a"/,
    );

    const elements = [
      <Text key='listed' component={Label} label='content' />,
      // @ts-expect-error "a" is not in the default allow-list
      <Text key='unlisted' component='a' />,
    ];

    expect(elements).toHaveLength(2);
  });

  /**
   * A per-component `polymorphic` replaces the default entirely: lists are
   * not merged, and `true` lifts the restriction.
   */
  it("lets a component replace the default allow-list", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const createTextComponent = defineCreateComponent({
      polymorphic: ["span"],
    });

    const Link = createTextComponent()({
      polymorphic: ["a"],
      Render: (Component, props) => <Component {...props} />,
    });
    Link.displayName = "Link";

    const Open = createTextComponent()({
      polymorphic: true,
      Render: (Component, props) => <Component {...props} />,
    });

    render(
      <>
        <Link component='a' href='/docs'>
          link
        </Link>
        <Open component='section'>open</Open>
      </>,
    );

    expect(screen.getByText("link").tagName).toBe("A");
    expect(screen.getByText("open").tagName).toBe("SECTION");
    expect(() => render(<Link {...unsafeComponent("span")} />)).toThrow(
      /Link received component="span"/,
    );

    const elements = [
      // @ts-expect-error the component's own list replaces the default one
      <Link key='default-list' component='span' />,
    ];

    expect(elements).toHaveLength(1);
  });
});
