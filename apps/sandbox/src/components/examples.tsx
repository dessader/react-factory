import { createComponent } from "@react-factory/create-component";

export const Card = createComponent()({
  element: "article",
  Render: (Component, props) => <Component {...props} />,
});

Card.displayName = "Card";

type BadgeProps = {
  count: number;
};

export const Badge = createComponent<BadgeProps>()({
  element: "span",
  Render: (Component, { count, ...props }) => (
    <Component data-count={count} {...props} />
  ),
});

Badge.displayName = "Badge";

export const Heading = createComponent()({
  element: "h2",
  Render: (Component, props) => <Component {...props} />,
});

Heading.displayName = "Heading";

export const StrictForm = createComponent()({
  element: "form",
  polymorphic: false,
  Render: (Component, props) => <Component {...props} />,
});

StrictForm.displayName = "Form";

type IconProps = {
  name: string;
};

export const Icon = createComponent<IconProps>()({
  element: "i",
  polymorphic: false,
  Render: (Component, { name, ...props }) => (
    <Component data-icon={name} {...props} />
  ),
});

Icon.displayName = "Icon";

export const Caption = createComponent()({
  element: "p",
  polymorphic: ["span", "figcaption", Icon],
  Render: (Component, props) => <Component {...props} />,
});

Caption.displayName = "Caption";

type AvatarProps = {
  src: string;
};

// `true` uses React.memo's default shallow prop comparison
export const Avatar = createComponent<AvatarProps>()({
  element: "img",
  memo: true,
  Render: (Component, { src, ...props }) => (
    <Component src={src} {...props} />
  ),
});

Avatar.displayName = "Avatar";

type PriceProps = {
  amount: number;
};

// A comparator function skips re-renders only when `amount` is unchanged,
// ignoring any other prop
export const Price = createComponent<PriceProps>()({
  element: "span",
  memo: (prev, next) => prev.amount === next.amount,
  Render: (Component, { amount, ...props }) => (
    <Component {...props}>{amount}</Component>
  ),
});

Price.displayName = "Price";

export const Input = createComponent()({
  element: "input",
  Render: (Component, props) => <Component {...props} />,
});

Input.displayName = "Input";
