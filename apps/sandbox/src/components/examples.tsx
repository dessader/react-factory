import { createComponent } from "@react-forge/core";

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
  Render: (Component, { count, ...rest }) => (
    <Component data-count={count} {...rest} />
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

type AvatarProps = {
  src: string;
};

// `true` uses React.memo's default shallow prop comparison
export const Avatar = createComponent<AvatarProps>()({
  element: "img",
  memo: true,
  Render: (Component, { src, ...rest }) => (
    <Component src={src} {...rest} />
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
  Render: (Component, { amount, ...rest }) => (
    <Component {...rest}>{amount}</Component>
  ),
});

Price.displayName = "Price";

export const Input = createComponent()({
  element: "input",
  Render: (Component, props) => <Component {...props} />,
});

Input.displayName = "Input";
